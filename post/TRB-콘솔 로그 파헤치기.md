---
start date: 2026-03-17
end date: 2026-03-17
project: "junseo-tech-blog"
category1: "trouble shooting"
COMPLETION: true
title: "콘솔 로그 파헤치기"
summary: 
  - 사소한 경로 오타가 불러온 렌더링 오류 해결하기. undefined 버튼에 대한 해결과 라이브러리 로드 실패 추적 과정
tags:
  - FrontEnd
  - html
---
## 상황  
프로젝트 목록 페이지에 테스트용 게시글 하나를 추가했는데 이상하게도 undefined button이 3개나 동시에 생겨버렸다. 게시글은 하나인데 왜 글은 3개나 생겼을까?
그리고 해당 게시글을 눌러보면 GNB와 footer만 있고 본문이 모두 날아가 있는 상태였다.
  
## 문제  
### 1. project page 렌더링 오류 발생
post는 1개인데 list는 3개가 뜨는 이상한 상황 발생

### 2. 상세 페이지 본문 렌더링 실패
GNB와 footer는 제대로 나오는데 본문만 렌더링 되지 않는 희안한 상황 발생

## 원인  
라이브러리가 없었음
  
## 시도  
- 처음에는 아예 감을 못잡아서 Gemeni에게 물어봤다. 그러던 중 브라우저 페이지 검사기의 console을 보라는 말에 확인해보니 library path 가 잘못된 것 같은 로그를 발견하였고 이를 집중적으로 의심하기 시작했다
- 라이브러리를 직접 추가했음에도 지속적으로 라이브러리를 찾지 못하는 것을 발견했고 경로가 통일되어 있는지 확인했다

## 해결  
라이브러리를 추가하고 경로 오타를 모두 수정하였다
  
## 회고
블로그 구조 상 library를 외부에서 import 하지 않으므로 path 구조를 안정화 했다