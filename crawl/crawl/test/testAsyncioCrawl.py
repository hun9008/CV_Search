import asyncio
import json
import time
import logging
from urllib.parse import urljoin, urlparse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    StaleElementReferenceException,
)
import threading
from concurrent.futures import ThreadPoolExecutor
from queue import Queue
import psutil
import os
from threading import Lock

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class CrawlerTask:
    def __init__(self, url, crawler_instance, timeout=10):
        self.url = url
        self.crawler = crawler_instance
        self.driver = None
        self.result_queue = Queue()
        self.process = None
        self.is_running = True
        self.timeout = timeout

    def setup_driver(self):
        options = webdriver.ChromeOptions()
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()), options=options
        )
        self.driver.implicitly_wait(5)
        self.process = psutil.Process(self.driver.service.process.pid)

    def run(self):
        """Selenium 크롤링 작업을 스레드에서 실행"""
        try:
            self.setup_driver()
            logger.info(
                f"Crawling {self.url} in thread {threading.current_thread().name}"
            )

            self.driver.get(self.url)
            WebDriverWait(self.driver, self.timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )

            try:
                self.driver.execute_script(
                    "document.querySelector('.fake-alert-class').remove();"
                )
            except:
                pass

            page_data = self.crawler._collect_page_data(self.driver, self.url)
            if not self.is_running:
                logger.warning(f"Task stopped before exploration for {self.url}")
                self.result_queue.put({"page_data": page_data, "new_urls": []})
                return

            new_urls = self.crawler._explore_page(self.driver, self.url)
            self.result_queue.put({"page_data": page_data, "new_urls": new_urls})
        except Exception as e:
            logger.error(f"Error in {self.url}: {e}")
            self.result_queue.put(
                {
                    "page_data": {"url": self.url, "title": "Error", "text": str(e)},
                    "new_urls": [],
                }
            )
        finally:
            self.stop()

    def stop(self):
        """psutil로 프로세스 강제 종료"""
        if not self.is_running:
            return
        self.is_running = False
        if self.process and self.process.is_running():
            try:
                for child in self.process.children(recursive=True):
                    child.kill()
                self.process.kill()
                logger.info(
                    f"Killed process tree for {self.url} (PID: {self.process.pid})"
                )
            except psutil.NoSuchProcess:
                logger.info(f"Process for {self.url} already terminated")
        else:
            logger.info(f"No process to kill for {self.url}")


class AdvancedWebCrawler:
    def __init__(
        self, base_domain="https://recruit.snowcorp.com", max_workers=5, timeout=10
    ):
        self.base_domain = urlparse(base_domain).netloc
        self.visited_urls = set()
        self.crawled_data = []
        self.graph_nodes = set()
        self.graph_edges = []
        self.link_cache = {}
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.loop = asyncio.get_event_loop()
        self.url_lock = Lock()
        self.timeout = timeout  # 클래스 수준에서 timeout 정의

    def _is_within_domain(self, url):
        parsed_url = urlparse(url)
        return parsed_url.netloc == self.base_domain

    def _collect_page_data(self, driver, url):
        try:
            return {
                "url": url,
                "title": driver.title,
                "text": driver.find_element(By.TAG_NAME, "body").text,
            }
        except Exception as e:
            logger.error(f"Error collecting page data for {url}: {e}")
            return {"url": url, "title": "Unknown", "text": ""}

    async def monitor_task(self, task, future):
        """자식 태스크 모니터링 및 타임아웃 시 프로세스 종료"""
        start_time = time.time()
        while not future.done():
            elapsed = time.time() - start_time
            if elapsed > task.timeout:
                logger.warning(f"Task for {task.url} timed out after {task.timeout}s")
                task.stop()
                future.cancel()
                return
            await asyncio.sleep(1)
        logger.info(f"Task for {task.url} completed")

    async def run_crawl_task(self, url):
        """단일 크롤링 태스크 실행"""
        task = CrawlerTask(url, self, timeout=self.timeout)  # crawler의 timeout 전달
        future = self.loop.run_in_executor(self.executor, task.run)
        monitor = asyncio.create_task(self.monitor_task(task, future))

        try:
            await future
            result = task.result_queue.get()
            if "error" in result:
                logger.error(f"Error in {url}: {result['error']}")
            return result
        except asyncio.CancelledError:
            logger.warning(f"Task for {url} was cancelled due to timeout or error")
            return task.result_queue.get() if not task.result_queue.empty() else None
        finally:
            monitor.cancel()

    async def crawl(self, start_url, max_pages=100):
        url_queue = asyncio.Queue()
        await url_queue.put(start_url)
        pages_crawled = 0
        tasks = set()

        while pages_crawled < max_pages:
            try:
                current_url = await asyncio.wait_for(url_queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                if not tasks:
                    break
                continue

            with self.url_lock:
                if current_url in self.visited_urls or not self._is_within_domain(
                    current_url
                ):
                    url_queue.task_done()
                    continue
                self.visited_urls.add(current_url)

            task = asyncio.create_task(self.run_crawl_task(current_url))
            tasks.add(task)
            task.add_done_callback(lambda t: tasks.discard(t))

            done, pending = await asyncio.wait(
                tasks, timeout=1, return_when=asyncio.FIRST_COMPLETED
            )

            for completed_task in done:
                result = await completed_task
                if result and "page_data" in result:
                    page_data = result["page_data"]
                    self.crawled_data.append(page_data)
                    self.graph_nodes.add(
                        f'"{page_data["url"]}"[Page: {page_data["url"]}]'
                    )
                    pages_crawled += 1

                    new_urls = result["new_urls"]
                    with self.url_lock:
                        for url in new_urls:
                            if url not in self.visited_urls:
                                await url_queue.put(url)

            url_queue.task_done()
            logger.info(
                f"Crawled {pages_crawled} pages, {len(tasks)} tasks running, {url_queue.qsize()} URLs in queue"
            )

        if tasks:
            logger.info(f"Waiting for {len(tasks)} remaining tasks to complete...")
            await asyncio.wait(tasks)

        self._save_results()
        self._save_graph()

    def _explore_page(self, driver, current_url, start_index=0):
        logger.info(f"Crawled page: {current_url} start_index {start_index}")
        if current_url not in self.link_cache:
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_all_elements_located((By.TAG_NAME, "a"))
                )
                links = driver.find_elements(By.TAG_NAME, "a")
                self.link_cache[current_url] = [
                    {
                        "href": link.get_attribute("href"),
                        "onclick": link.get_attribute("onclick"),
                    }
                    for link in links
                ]
            except TimeoutException:
                logger.warning(f"Timeout waiting for links on {current_url}")
                return []

        new_urls = []
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.TAG_NAME, "a"))
            )
            links = driver.find_elements(By.TAG_NAME, "a")
        except TimeoutException:
            logger.warning(f"Timeout reloading links on {current_url}")
            return []

        for i in range(start_index, len(links)):
            try:
                link_data = links[i]
                href = link_data.get_attribute("href")
                onclick = link_data.get_attribute("onclick")
                link_node = f'"{current_url}_link_{i}"[Link: {i}]'

                if href and self._is_within_domain(href) and not onclick:
                    new_urls.append(href)
                    self.graph_edges.append(f'"{current_url}" --> |Href| "{href}"')

                if onclick:
                    task = CrawlerTask(current_url, self, timeout=self.timeout)
                    future = self.executor.submit(
                        self._run_onclick, task, onclick, link_data
                    )
                    result = future.result(
                        timeout=self.timeout + 5
                    )  # 클래스 timeout 사용
                    if result and "page_data" in result:
                        with self.url_lock:
                            if result["page_data"]["url"] not in self.visited_urls:
                                self.crawled_data.append(result["page_data"])
                                self.graph_nodes.add(
                                    f'"{result["page_data"]["url"]}"[Page: {result["page_data"]["url"]}]'
                                )
                        new_urls.extend(result["new_urls"])
                    self.graph_edges.append(
                        f'{link_node} --> |Onclick| "Threaded Task"'
                    )

            except StaleElementReferenceException:
                logger.warning(
                    f"Stale element at index {i} on {current_url}, retrying..."
                )
                try:
                    links = driver.find_elements(By.TAG_NAME, "a")
                    if i < len(links):
                        link_data = links[i]
                        href = link_data.get_attribute("href")
                        if (
                            href
                            and self._is_within_domain(href)
                            and not link_data.get_attribute("onclick")
                        ):
                            new_urls.append(href)
                            self.graph_edges.append(
                                f'"{current_url}" --> |Href| "{href}"'
                            )
                except Exception as e:
                    logger.error(f"Retry failed for index {i} on {current_url}: {e}")
            except Exception as e:
                logger.error(f"Error processing link {i} on {current_url}: {e}")
                return new_urls

        return new_urls

    def _run_onclick(self, task, onclick_script, link_element):
        """onclick 이벤트 처리용 별도 스레드 실행"""
        try:
            task.setup_driver()
            task.driver.get(task.url)
            WebDriverWait(task.driver, task.timeout).until(
                EC.presence_of_all_elements_located((By.TAG_NAME, "a"))
            )
            links = task.driver.find_elements(By.TAG_NAME, "a")
            if len(links) > link_element._id:
                target_link = next(l for l in links if l._id == link_element._id)
                task.driver.execute_script(onclick_script, target_link)
                time.sleep(1)
                new_url = task.driver.current_url
                new_urls = (
                    self._explore_page(task.driver, new_url)
                    if new_url != task.url
                    else []
                )
                task.result_queue.put(
                    {
                        "page_data": self._collect_page_data(task.driver, new_url),
                        "new_urls": new_urls,
                    }
                )
            else:
                task.result_queue.put({"error": "Link not found after reload"})
        except Exception as e:
            task.result_queue.put({"error": str(e)})
        finally:
            task.stop()
        return task.result_queue.get()

    def _save_results(self):
        with open("crawled_data.json", "w", encoding="utf-8") as f:
            json.dump(self.crawled_data, f, ensure_ascii=False, indent=4)
        logger.info(f"Saved {len(self.crawled_data)} pages to crawled_data.json")

    def _save_graph(self):
        with open("crawler_graph.mmd", "w", encoding="utf-8") as f:
            f.write("graph TD\n")
            for node in self.graph_nodes:
                f.write(f"    {node}\n")
            for edge in self.graph_edges:
                f.write(f"    {edge}\n")
        logger.info("Graph saved to crawler_graph.mmd")


async def main():
    crawler = AdvancedWebCrawler(base_domain="https://recruit.snowcorp.com")
    start_url = "https://recruit.snowcorp.com/rcrt/list.do"
    await crawler.crawl(start_url, max_pages=10)


if __name__ == "__main__":
    asyncio.run(main())
