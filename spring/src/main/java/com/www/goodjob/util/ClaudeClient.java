package com.www.goodjob.util;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ClaudeClient {

    private final AnthropicClient client;

    public ClaudeClient(@Value("${anthropic.api-key}") String apiKey) {
        this.client = AnthropicOkHttpClient.builder()
                .apiKey(apiKey)
                .build();
    }

    public String generateFeedback(String cvText, String jobText) {
        MessageCreateParams params = MessageCreateParams.builder()
                .model(Model.CLAUDE_3_7_SONNET_20250219)
                .maxTokens(1500)
                .temperature(0.7)
                .system("""
                        당신은 AI 이력서 평가자입니다.
                        아래에 제공된 이력서(CV)와 채용 공고(Job Description)를 바탕으로, 지원자가 해당 포지션에 적합한지를 평가한 피드백을 한글로 작성해주세요.
                        전체 피드백은 1500자 이내로 작성해주세요. 각 항목은 간결하면서도 핵심을 포함해주세요.
                        
                        피드백은 다음 세 항목으로만 구성되며, 반드시 아래 형식을 따라야 합니다:
                        
                        좋은 점:
                        - 이력서에서 채용 공고와 잘 부합하는 기술, 경험, 표현을 구체적인 예시와 함께 서술해주세요.
                        - 잘 부합하여 강조할 점은 `**강조**` 형식으로 표현해주세요.
                        - 예시:
                          - **FastAPI, Docker, NGINX** 등을 활용한 서비스 배포 및 운영 경험은 **채용 공고에서 요구하는 백엔드 시스템 개발 및 API 개발 역량**과 직접적으로 부합합니다.
                          - 다양한 **데이터베이스(MySQL, MongoDB)를 활용한 경험**과 데이터베이스 마이그레이션 경험은 **대규모 데이터 처리 능력**을 보여줍니다.
                        
                        부족한 점:
                        - 채용 공고에서 요구하는 요건 중 이력서에 명확히 드러나지 않거나 부족해 보이는 부분을 지적해주세요.
                        - **강조가 필요한 부족한 부분은 `**강조**` 표시로 명확히 표현해주세요.**
                        
                        추가 팁:
                        - 경쟁력을 높이기 위해 추가하거나 보완하면 좋을 내용, 표현, 학습 또는 포트폴리오 개선 방향을 제안해주세요.
                        - 특히 **추가할 기술 스택, 실무 경험, 표현 개선 등**은 `**강조**` 형식으로 강조해주세요.
                        
                        - 각 항목 제목은 반드시 `## 좋은 점:`, `## 부족한 점:`, `## 추가 팁:`으로 작성합니다.
                        - 각 항목 아래는 `-` 기호로 문장 단위로 구분합니다.
                        - 반드시 `## 좋은 점:`으로 시작해주세요. `# 이력서 피드백` 등의 머리말은 절대 작성하지 마세요.
                        - 모든 문장은 존댓말을 사용하고, 구체적이고 실질적인 조언을 포함해주세요.
                        - 위의 세 항목 외에는 어떤 내용도 작성하지 마세요.
                        - 각 항목에서 강조할 점은 `**강조**` 형식으로 표현해주세요.
                        """)

                .addUserMessage("이력서:\n" + cvText + "\n\n채용 공고:\n" + jobText)
                .build();

        Message message = client.messages().create(params);

        // return message.content().toString();
        return message.content().stream()
                .map(ContentBlock::text)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(TextBlock::text)
                .reduce("", (a, b) -> a + b);
    }

    public String generateCvSummary(String cvText) {
        MessageCreateParams params = MessageCreateParams.builder()
                .model(Model.CLAUDE_3_7_SONNET_20250219)
                .maxTokens(1000)
                .temperature(0.5)
                .system("""
                            당신은 이력서 요약 전문가입니다.
                            아래에 제공된 이력서(CV)를 바탕으로, 해당 인재의 핵심 정보를 한글로 요약해주세요. 
                            총 분량은 1000자 이내로 제한하며, 간결하면서도 핵심이 잘 드러나도록 작성해야 합니다.
                        
                            아래의 다섯 개 항목을 반드시 포함하여 작성하세요:
                        
                            직무 지향성과 핵심 역량: 
                               - 사용자가 어떤 분야나 직무를 지향하는지, 그리고 이를 뒷받침하는 핵심 역량을 요약합니다.
                        
                            Skills:
                               - CV에 기재된 기술 스택, 언어, 프레임워크, 툴 등을 항목별로 구체적으로 정리합니다. 
                               - 단순 나열이 아닌, 해당 기술의 활용 경험이 간략히 드러나도록 서술합니다.
                        
                            Education:
                               - 이수한 전공, 학교, 학위, 연도 등 주요 학력 정보를 정리합니다. 
                               - 복수 전공, 우수 성적, 관련 과목 이수 여부 등이 있다면 함께 반영합니다.
                        
                            Experience:
                               - 실무 경험, 인턴십, 팀 프로젝트, 개인 프로젝트 모두 목표, 역할, 기술 활용, 성과 등을 간결히 정리합니다.
                        
                            Awards:
                               - 수상 이력이나 인증서가 있다면 반드시 포함하여 해당 인재의 경쟁력을 부각시켜주세요.
                        
                            각 항목은 '직무 지향성과 핵심 역량:', 'Skills:', 'Education:', 'Experience', 'Awards' 로 제목을 명확히 작성하며, 그 아래에 `-` 기호로 문장 단위의 항목을 구분해주세요.
                            모든 문장은 존댓말을 사용하며, 군더더기 없는 자연스러운 서술문 형식으로 작성합니다. 
                            Skills, Education, Experience, Awards는 해당사항이 없다면 생략해야 합니다.
                        """)
                .addUserMessage("이력서:\n" + cvText)
                .build();

        Message message = client.messages().create(params);

        return message.content().stream()
                .map(ContentBlock::text)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(TextBlock::text)
                .reduce("", (a, b) -> a + b);
    }
}
