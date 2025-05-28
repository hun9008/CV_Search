package com.www.goodjob;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GoodjobApplication {
	public static void main(String[] args) {
		// .env 파일 로드 (파일이 없으면 무시)
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		// .env 파일의 모든 엔트리를 시스템 프로퍼티에 등록
		dotenv.entries().forEach(entry ->
				System.setProperty(entry.getKey(), entry.getValue())
		);

		// Spring Boot 애플리케이션 실행
		SpringApplication.run(GoodjobApplication.class, args);
	}
}
