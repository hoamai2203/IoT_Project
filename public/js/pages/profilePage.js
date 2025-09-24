(() => {
  const nameEl = document.getElementById('profileName');
  if (!nameEl) return;
  const fullNameEl = document.getElementById('profileFullName');
  const emailEl = document.getElementById('profileEmail');
  const avatarEl = document.getElementById('profileAvatar');
  const codeEl = document.getElementById('profileCode');
  const projectEl = document.getElementById('profileProject');
  const githubEl = document.getElementById('profileGithub');

  async function load() {
    try {
      const res = await API.profile.get();
      if (res.success) {
        const p = res.data;
        nameEl.textContent = p.name || '--';
        fullNameEl.value = p.name || '--';
        emailEl.value = p.email || '--';
        avatarEl.src = p.avatar || avatarEl.src;
        codeEl.value = p.code || '--';
        projectEl.value = p.project || '--';
        githubEl.value = p.github || '--';
      }
    } catch (e) {
      // silent
    }
  }

  load();
})();


