const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer');
class WorkerPool {
  constructor(maxWorkers = 5) {
    this.maxWorkers = Math.min(maxWorkers, os.cpus().length);
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
  }

  async processTasks(tasks, processor) {
    return new Promise((resolve, reject) => {
      const results = new Array(tasks.length);
      let completed = 0;
      let started = 0;

      const checkComplete = () => {
        if (completed === tasks.length) {
          resolve(results);
        }
      };

      const startNextTask = () => {
        if (started >= tasks.length) return;
        if (this.activeWorkers >= this.maxWorkers) return;

        const taskIndex = started++;
        const task = tasks[taskIndex];
        this.activeWorkers++;

        this.getWorker().then(worker => {
          processor(task, worker).then(result => {
            results[taskIndex] = result;
            this.activeWorkers--;
            completed++;
            this.releaseWorker(worker);
            startNextTask();
            checkComplete();
          }).catch(error => {
            results[taskIndex] = {
              error: error.toString(),
              success: false,
              index: task.index,
              sourceType: task.type
            };
            this.activeWorkers--;
            completed++;
            this.releaseWorker(worker);
            startNextTask();
            checkComplete();
          });
        });

        // 큐에 작업이 있고 활성 워커가 최대치보다 적으면 다음 작업 시작
        if (this.activeWorkers < this.maxWorkers) {
          setTimeout(startNextTask, 0);
        }
      };

      // 최초 작업 시작
      for (let i = 0; i < this.maxWorkers && i < tasks.length; i++) {
        startNextTask();
      }
    });
  }

  async getWorker() {
    // 새 워커 생성 또는 대기중인 워커 반환
    if (this.workers.length < this.maxWorkers) {
      const worker = await puppeteer.launch({ headless: true });
      const page = await worker.newPage();
      return { worker, page };
    } else {
      return new Promise(resolve => {
        this.taskQueue.push(resolve);
      });
    }
  }

  releaseWorker(worker) {
    if (this.taskQueue.length > 0) {
      const resolve = this.taskQueue.shift();
      resolve(worker);
    } else {
      this.workers.push(worker);
    }
  }

  async close() {
    await Promise.all(this.workers.map(async ({ worker }) => {
      await worker.close();
    }));
    this.workers = [];
  }
}

module.exports = { WorkerPool };