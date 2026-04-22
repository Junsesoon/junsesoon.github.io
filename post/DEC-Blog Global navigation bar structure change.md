---
date: 2026-03-31
project:
  - GB
category1: decision
tags:
  - UI
  - UX
---
# 요약
블로그 Global Navigation Bar의 구성과 역할을 수정하였음

# 배경
- [[wire-frame-v2.0.0|wire-frame-v2.0.0]]
- 블로그 글이 많아질 경우 side bar의 폴더트리가 급격하게 길어질텐데 어떻게 하는게 좋을지 고민하게 됨

# 문제
- 헤더 메뉴를 Global navigation으로 쓰고 싶으나 header menu는 구성이 자주 바뀌면 안 된다고 생각함
- 그러나 가장 중요한 파트인 PRJECT screen이 Post로 인해 집중력을 잃을 우려가 있음

# 옵션
옵션A: 사이드 바를 Global nav로 유지
- 장점: side bar를 통해 blog의 모든 곳을 탐색 가능
- 단점: Post가 많아지면 Project 포스팅의 몰입도가 떨어짐

옵션B: 개별 프로젝트 진입시 side bar를 local nav로 전환. Global은 header menu로 진입
- 장점: 읽는 사람이 개별 프로젝트에 몰입하여 리딩할 수 있는 효과가 기대됨
- 단점: 프로젝트가 아닌 다른 메뉴로 이동하고 싶을 때 습관적으로 side bar를 찾게 되면 UX가 떨어지게 됨

# 결정
- 옵션B 채택

# 이유
- 블로그에서 가장 중요한 파트가 Project라고 생각하여 해당 프로젝트 게시글 외엔 가리는 것이 집중력 유지에 유리하다고 판단함
- 메뉴 확장 가능성이 낮음
- 메뉴가 크게 확장되더라도 header menu의 depth를 추가하여 대응이 가능함
