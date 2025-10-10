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
        nameEl.textContent = p.name || 'Nông Thị Hoa Mai';
        fullNameEl.value = p.name || 'Hệ thống cảm biến IoT';
        emailEl.value = p.email || 'nongthihoamai@gmail.com';
        avatarEl.src = p.avatar || avatarEl.src;
        codeEl.value = p.code || 'B22DCCN515';
        projectEl.value = p.project || 'Hệ thống cảm biến IoT';
        githubEl.value = p.github || 'https://github.com/hoamai2203/IoT_Project';
      }
    } catch (e) {
      // silent
    }
  }

  load();
})();

const btnShowReport = document.getElementById('btnShowReport');

btnShowReport.addEventListener('click', () => {
  window.open('https://drive.google.com/file/d/1qRgFCWQz59rF9PwAbIiuCNMiexBpXW85/view?usp=sharing', '_blank');
});

