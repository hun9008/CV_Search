#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

// 실행할 스레드 함수
void* thread_function(void* arg) {
    int thread_id = *(int*)arg;  // 전달받은 스레드 ID //void에서 캐스딩이 필요하군
    for (int i = 0; i < 5; i++) {
        printf("스레드 %d 실행 중... (반복 %d)\n", thread_id, i + 1);
        sleep(1);  // 1초 대기
    }
    printf("스레드 %d 종료\n", thread_id);
    return NULL;
}

int main() {
    pthread_t thread1, thread2;
    int id1 = 1, id2 = 2;

    // 스레드 생성
    if (pthread_create(&thread1, NULL, thread_function, &id1) != 0) {
        perror("스레드 1 생성 실패");
        return 1;
    }
    if (pthread_create(&thread2, NULL, thread_function, &id2) != 0) {
        perror("스레드 2 생성 실패");
        return 1;
    }

    // 스레드 종료 대기 (메인 스레드가 종료되지 않도록)
    pthread_join(thread1, NULL);
    pthread_join(thread2, NULL);

    printf("모든 스레드 종료, 프로그램 종료\n");
    return 0;
}
