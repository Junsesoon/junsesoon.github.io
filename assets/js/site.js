(() => {
  const backdrop = document.querySelector(".backdrop");
  const modal = document.getElementById("project-modal");

  const elTitle = document.getElementById("pm-title");
  const elPurpose = document.getElementById("pm-purpose");
  const elPeriod = document.getElementById("pm-period");
  const elTeam = document.getElementById("pm-team");
  const elEnv = document.getElementById("pm-env");
  const elTroubles = document.getElementById("pm-troubles");
  const elTags = document.getElementById("pm-tags");

  // PPT 4~5p 기준 더미 데이터(내용 피드백은 나중에)
  const PROJECTS = {
    "pipeline-bot": {
      title: "봇을 활용한 파이프라인 개편",
      purpose: "목적 : 텔레그램 봇 기능을 활용한 행정력 감소 및 통계 자동화",
      period: "YYYY.MM.DD ~ YYYY.MM.DD",
      team: "1 명",
      env: {
        Language: "-",
        Library: "-",
        DB: "-",
        IDE: "-"
      },
      troubles: [
        { date: "YYYY.MM.DD(E)", title: "라이브러리 의존성 충돌", cause: "제목 / 주요원인" },
        { date: "YYYY.MM.DD(E)", title: "봇 무반응", cause: "제목 / 주요원인" },
        { date: "YYYY.MM.DD(E)", title: "아 ..  컨테이너가 …", cause: "" },
        { date: "YYYY.MM.DD(E)", title: "왜 안 되지 ~", cause: "" },
        { date: "YYYY.MM.DD(E)", title: "깃깃깃 !  스태시가 사라졌다 !", cause: "" },
        { date: "YYYY.MM.DD(E)", title: "도커가 뭐지 ..?", cause: "" },
        { date: "YYYY.MM.DD(E)", title: "토큰이없다 !", cause: "" },
        { date: "YYYY.MM.DD(E)", title: "서버가 필요해 !", cause: "" },
      ],
      tags: ["텔레그램", "실행환경", "환경변수", "깃", "도커", "네트워크", "서버"]
    }
  };

  function openModal(projectId) {
    const p = PROJECTS[projectId];
    if (!p) return;

    elTitle.textContent = p.title;
    elPurpose.textContent = p.purpose;
    elPeriod.textContent = p.period;
    elTeam.textContent = p.team;

    // env kv
    elEnv.innerHTML = "";
    Object.entries(p.env).forEach(([k, v]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="kv__k">${k}</span><span class="kv__v mono">${v}</span>`;
      elEnv.appendChild(li);
    });

    // troubles
    elTroubles.innerHTML = "";
    p.troubles.forEach((t) => {
      const div = document.createElement("div");
      div.className = "trouble";
      div.innerHTML = `
        <div class="trouble__row">
          <span class="mono">${t.date}</span>
          <span>•</span>
          <span>${t.title}</span>
        </div>
        ${t.cause ? `<div class="trouble__cause">${t.cause}</div>` : ""}
      `;
      elTroubles.appendChild(div);
    });

    // tags
    elTags.innerHTML = "";
    p.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      elTags.appendChild(span);
    });

    backdrop.style.display = "block";
    modal.showModal();
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (modal.open) modal.close();
    backdrop.style.display = "none";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open-project]");
    if (btn) {
      openModal(btn.getAttribute("data-open-project"));
      return;
    }

    if (e.target.matches("[data-close]") || e.target.closest("[data-close]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  backdrop.addEventListener("click", closeModal);
})();