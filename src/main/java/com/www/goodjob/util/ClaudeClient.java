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
        System.out.println("✅ Claude API KEY = " + apiKey);
        this.client = AnthropicOkHttpClient.builder()
                .apiKey(apiKey)
                .build();
    }

    public String generateFeedback(String cvText, String jobText) {
        MessageCreateParams params = MessageCreateParams.builder()
                .model(Model.CLAUDE_3_7_SONNET_20250219)
                .maxTokens(1000)
                .temperature(0.7)
                .system("You are an AI resume evaluator. Match CV with job description and generate feedback.")
                .addUserMessage("CV:\n" + cvText + "\n\nJob:\n" + jobText)
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
}
