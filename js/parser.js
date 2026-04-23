/**
 * Markdown 텍스트에서 Front Matter와 순수 콘텐츠를 분리하여 파싱합니다.
 * @param {string} markdown - 파싱할 Markdown 전체 텍스트.
 * @returns {{frontMatter: object, content: string}} - 파싱된 Front Matter 객체와 나머지 콘텐츠.
 */
export function parseFrontMatter(markdown) {
    // 'g' 플래그를 제거하여 lastIndex 상태 문제를 방지하고, 항상 문자열 시작부터 찾도록 합니다.
    const frontMatterRegex = /^---([\s\S]*?)---\s*/;
    const match = frontMatterRegex.exec(markdown);

    if (!match) {
        return { frontMatter: {}, content: markdown };
    }

    const frontMatterBlock = match[1];
    const content = markdown.substring(match[0].length);
    const frontMatter = {};
    const lines = frontMatterBlock.split('\n');

    let currentKey = null;

    lines.forEach(line => {
        // 비어있는 줄은 무시합니다.
        if (line.trim() === '') {
            // 만약 현재 키가 있고, 그 값이 문자열이라면 빈 줄도 값의 일부로 추가합니다.
            if (currentKey !== null && typeof frontMatter[currentKey] === 'string') {
                frontMatter[currentKey] += '\n';
            }
            return;
        }

        const lineIndent = line.match(/^\s*/)[0].length; // 현재 줄의 들여쓰기 수준
        const trimmedLine = line.trimStart(); // 들여쓰기를 제외한 실제 내용

        const colonIndex = trimmedLine.indexOf(':');
        const isNewKey = colonIndex > -1 && lineIndent === 0; // 들여쓰기 없이 시작하는 새로운 키



        if (isNewKey) { // 새로운 키-값 쌍 시작
            currentKey = trimmedLine.substring(0, colonIndex).trim(); // 키 추출
            const value = trimmedLine.substring(colonIndex + 1).trim(); // 값 추출
            frontMatter[currentKey] = value; // 초기 값 설정 (문자열)
        } else if (currentKey !== null && lineIndent > 0) { // 현재 키에 속하는 들여쓰기된 줄
            if (currentKey === 'summary') {
                // 'summary' 필드는 항상 다중 라인 문자열로 처리
                if (typeof frontMatter[currentKey] === 'string') {
                    frontMatter[currentKey] += '\n' + trimmedLine;
                } else {
                    // 만약 summary가 배열이 되어버린 경우 (예상치 못한 상황), 문자열로 변환 후 추가
                    frontMatter[currentKey] = Array.isArray(frontMatter[currentKey])
                        ? frontMatter[currentKey].join('\n') + '\n' + trimmedLine
                        : trimmedLine;
                }
            } else if (trimmedLine.startsWith('-')) {
                // 다른 키의 경우, '-'로 시작하면 리스트 아이템으로 처리
                const listItem = trimmedLine.substring(1).trim();
                if (!Array.isArray(frontMatter[currentKey])) {
                    // 기존 값이 문자열이었다면 배열로 변환하고 기존 값을 첫 번째 아이템으로 추가
                    frontMatter[currentKey] = frontMatter[currentKey] ? [frontMatter[currentKey]] : [];
                }
                frontMatter[currentKey].push(listItem);
            } else {
                // 다른 키의 경우, 들여쓰기된 줄이지만 리스트 아이템이 아니면 문자열의 연속으로 처리
                if (typeof frontMatter[currentKey] === 'string') {
                    frontMatter[currentKey] += '\n' + trimmedLine;
                }
            }
        }
    });

    // 값의 형식을 일관성 있게 문자열로 변환합니다.
    for (const key in frontMatter) {
        let value = frontMatter[key];

        // 1. 배열 또는 배열 형태의 문자열을 콤마로 구분된 문자열로 변환
        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
            // "[tag1, tag2]" -> "tag1, tag2"
            frontMatter[key] = value.substring(1, value.length - 1).split(',').map(item => item.trim().replace(/^["']|["']$/g, '')).join(', ');
        } else if (Array.isArray(value)) {
            // ["tag1", "tag2"] -> "tag1, tag2"
            frontMatter[key] = value.map(item => item.replace(/^["']|["']$/g, '')).join(', ');
        } else if (typeof value === 'string') {
            // "value" -> value (따옴표 제거)
            frontMatter[key] = value.replace(/^["']|["']$/g, '');
        }
    }

    return { frontMatter, content };
}