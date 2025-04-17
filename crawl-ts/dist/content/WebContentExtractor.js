"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebContentExtractor = void 0;
const logger_1 = require("../utils/logger");
const urlUtils_1 = require("../url/urlUtils");
/**
 * 웹 콘텐츠 추출 구현체
 * 페이지에서 콘텐츠와 링크를 추출합니다.
 */
class WebContentExtractor {
    /**
     * 웹 페이지에서 콘텐츠 추출
     * @param page Puppeteer 페이지 객체
     * @returns 추출된 콘텐츠 객체
     */
    async extractPageContent(page) {
        const startTime = Date.now();
        try {
            const result = await page.evaluate(() => {
                // 페이지 내에서 텍스트 추출 함수 정의 (페이지 컨텍스트 내에서)
                function extractTextFromNode(node) {
                    // 텍스트 노드인 경우
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.textContent?.trim() || '';
                    }
                    // 특정 태그는 건너뛰기 (스크립트, 스타일, 코드, noscript 등)
                    const nodeName = node.nodeName;
                    if (nodeName === 'SCRIPT' ||
                        nodeName === 'STYLE' ||
                        nodeName === 'CODE' ||
                        nodeName === 'NOSCRIPT' ||
                        nodeName === 'SVG') {
                        return '';
                    }
                    // 노드가 보이지 않는 경우 건너뛰기
                    try {
                        const element = node;
                        const style = window.getComputedStyle(element);
                        if (style && (style.display === 'none' || style.visibility === 'hidden')) {
                            return '';
                        }
                    }
                    catch (e) {
                        // getComputedStyle은 요소 노드에서만 작동
                    }
                    // 자식 노드 처리
                    let text = '';
                    const childNodes = node.childNodes;
                    for (let i = 0; i < childNodes.length; i++) {
                        text += extractTextFromNode(childNodes[i]) + ' ';
                    }
                    return text.trim();
                }
                // 타이틀 추출
                const title = document.title || '';
                // 메타 태그 추출
                const meta = {};
                const metaTags = document.querySelectorAll('meta');
                metaTags.forEach(tag => {
                    const name = tag.getAttribute('name') || tag.getAttribute('property');
                    const content = tag.getAttribute('content');
                    if (name && content) {
                        meta[name] = content;
                    }
                });
                // 주요 텍스트 내용 추출 - 함수가 페이지 컨텍스트 내에 정의되어 있음
                const mainText = extractTextFromNode(document.body);
                // 긴 텍스트 정리 및 가독성 향상
                const cleanedText = mainText
                    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
                    .replace(/\n\s*\n/g, '\n') // 빈 줄 제거
                    .trim()
                    .substring(0, 100000); // 텍스트 길이 제한
                return {
                    title,
                    meta,
                    text: cleanedText
                };
            });
            const runtime = Date.now() - startTime;
            logger_1.defaultLogger.eventInfo('extract_page_content', { runtime });
            return result;
        }
        catch (error) {
            logger_1.defaultLogger.error('콘텐츠 추출 중 오류:', error);
            // 오류 발생 시 기본값 반환
            return {
                title: '',
                meta: {},
                text: ''
            };
        }
    }
    /**
     * 웹 페이지에서 링크 추출
     * @param page Puppeteer 페이지 객체
     * @param allowedDomains 허용된 도메인 목록
     * @returns 추출된 URL 목록
     */
    async extractLinks(page, allowedDomains) {
        try {
            // 현재 페이지 URL 가져오기
            const pageUrl = page.url();
            const baseUrl = new URL(pageUrl).origin;
            const currentPath = new URL(pageUrl).pathname;
            logger_1.defaultLogger.debug(`링크 추출 중... 기준 URL: ${pageUrl}, 허용 도메인: ${allowedDomains.join(', ')}`);
            // 페이지 내 모든 링크 추출 (절대 경로와 상대 경로 모두)
            const links = await page.evaluate((baseUrl, currentPath) => {
                // 상대 경로를 절대 경로로 변환하는 함수
                function resolveUrl(base, relative) {
                    try {
                        // 이미 절대 URL인 경우
                        if (relative.startsWith('http://') || relative.startsWith('https://')) {
                            return relative;
                        }
                        // 빈 링크, 자바스크립트 링크, 앵커 링크, 메일 링크 건너뛰기
                        if (!relative || relative.startsWith('#') ||
                            relative.startsWith('javascript:') ||
                            relative.startsWith('mailto:') ||
                            relative.startsWith('tel:')) {
                            return null;
                        }
                        // 루트 경로인 경우
                        if (relative.startsWith('/')) {
                            return new URL(relative, base).href;
                        }
                        // 프로토콜 상대 URL인 경우
                        if (relative.startsWith('//')) {
                            return new URL(`https:${relative}`).href;
                        }
                        // 상대 경로인 경우
                        // 현재 경로의 마지막 부분 제거 (파일명이나 마지막 디렉토리)
                        const pathParts = currentPath.split('/');
                        // 파일 확장자가 있거나 마지막 요소가 비어있지 않은 경우 마지막 부분 제거
                        if (pathParts[pathParts.length - 1].includes('.') || pathParts[pathParts.length - 1] !== '') {
                            pathParts.pop();
                        }
                        let basePath = pathParts.join('/');
                        if (!basePath.endsWith('/')) {
                            basePath += '/';
                        }
                        return new URL(basePath + relative, base).href;
                    }
                    catch (e) {
                        console.error(`URL 변환 실패: ${relative}`, e);
                        return null;
                    }
                }
                // 모든 앵커 요소 찾기
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                const extractedUrls = [];
                anchors.forEach(anchor => {
                    const href = anchor.getAttribute('href');
                    // href 속성이 있는지 확인
                    if (href) {
                        const resolvedUrl = resolveUrl(baseUrl, href);
                        if (resolvedUrl) {
                            extractedUrls.push(resolvedUrl);
                        }
                    }
                });
                return extractedUrls;
            }, baseUrl, currentPath);
            // 중복 제거
            const uniqueLinks = [...new Set(links.filter(Boolean))];
            // 허용된 도메인 필터링
            const allowedLinks = uniqueLinks.filter(url => {
                try {
                    return (0, urlUtils_1.isUrlAllowed)(url, allowedDomains);
                }
                catch (e) {
                    logger_1.defaultLogger.debug(`URL 필터링 실패: ${url}`, e);
                    return false;
                }
            });
            logger_1.defaultLogger.debug(`${uniqueLinks.length}개의 고유 URL 중 ${allowedLinks.length}개 URL이 도메인 필터를 통과했습니다.`);
            return allowedLinks;
        }
        catch (error) {
            logger_1.defaultLogger.error('링크 추출 중 오류:', error);
            return [];
        }
    }
    async extractOnclickLinks(page, allowedDomains) {
        // 1. 스크롤하면서 모든 a[onclick] 태그 수집
        const onclickScripts = await this.collectOnclickScriptsWithScroll(page);
        // 2. 각 onclick 스크립트를 병렬로 실행해 redirect된 URL 수집
        const redirectedUrls = await Promise.all(onclickScripts.map(async (script) => {
            const tempPage = await page.browser().newPage();
            try {
                const html = await page.content();
                await tempPage.setContent(html);
                await tempPage.evaluate(script);
                await tempPage.waitForNavigation({ waitUntil: 'load', timeout: 3000 }).catch(() => { });
                console.log(tempPage.url());
                return tempPage.url();
            }
            catch (err) {
                console.error(`Error executing onclick script: ${script}`, err);
                return null;
            }
            finally {
                await tempPage.close();
            }
        }));
        // 3. 유효한 URL 중 allowedDomains에 해당하는 것만 필터링
        const filteredUrls = redirectedUrls.filter((url) => !!url && allowedDomains.some(domain => url.includes(domain)));
        return filteredUrls;
    }
    async collectOnclickScriptsWithScroll(page) {
        const collected = new Set();
        let previousHeight = 0;
        for (let i = 0; i < 10; i++) { // 제한적으로 10번까지만 스크롤
            const newOnclicks = await page.$$eval('a[onclick]', (anchors) => anchors.map((a) => a.getAttribute('onclick') || ''));
            newOnclicks.forEach((s) => collected.add(s));
            // 스크롤을 아래로 내림
            const currentHeight = await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
                return document.body.scrollHeight;
            });
            if (currentHeight === previousHeight)
                break;
            previousHeight = currentHeight;
            // 새 콘텐츠 로딩을 기다림
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return Array.from(collected);
    }
}
exports.WebContentExtractor = WebContentExtractor;
//# sourceMappingURL=WebContentExtractor.js.map