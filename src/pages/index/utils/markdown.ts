// 간단한 마크다운 파서 함수
export function parseMarkdown(text: string): string {
    // 제목 변환 (## 제목)
    text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');

    // 강조 변환 (**텍스트**)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 이탤릭 변환 (*텍스트*)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 목록 변환 (- 항목)
    text = text.replace(/- (.*?)$/gm, '<li>$1</li>');
    text = text.replace(/<li>(.*?)<\/li>/g, (match) => '<ul>' + match + '</ul>');

    // 줄바꿈 처리
    text = text.replace(/\n/g, '<br>');

    return text;
}
