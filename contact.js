// 문의하기 폼 제출 처리
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var msg = document.getElementById('cf-msg');
  var submitBtn = document.getElementById('cf-submit');
  var modal = document.getElementById('doneModal');

  function setMsg(text, kind) {
    msg.textContent = text;
    msg.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  // 완료 팝업 열기/닫기
  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var okBtn = modal.querySelector('.btn');
    if (okBtn) okBtn.focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (modal) {
    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // Cloudflare Turnstile 토큰 가져오기
  function getTurnstileToken() {
    if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
      try { return window.turnstile.getResponse() || ''; } catch (_) {}
    }
    var hidden = form.querySelector('[name="cf-turnstile-response"]');
    return hidden ? hidden.value : '';
  }

  function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
      try { window.turnstile.reset(); } catch (_) {}
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setMsg('', '');

    var name = document.getElementById('cf-name').value.trim();
    var email = document.getElementById('cf-email').value.trim();
    var message = document.getElementById('cf-message').value.trim();
    var typeEl = form.querySelector('input[name="type"]:checked');
    var type = typeEl ? typeEl.value : '';

    if (!name || !email || !message) {
      setMsg('이름·이메일·문의 내용을 모두 입력해 주세요.', 'err');
      return;
    }

    var ts_token = getTurnstileToken();
    if (!ts_token) {
      setMsg('보안 확인이 완료되지 않았어요. 잠시 후 다시 시도해 주세요.', 'err');
      return;
    }

    var origLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>보내는 중…';

    function restoreBtn() {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origLabel;
    }
    function onFail() {
      setMsg('전송에 실패했어요. 잠시 후 다시 시도해 주세요.', 'err');
      resetTurnstile();
      restoreBtn();
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://monstory.app/api/contact.php', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        form.reset();
        resetTurnstile();
        setMsg('', '');
        openModal();
        restoreBtn();
      } else {
        onFail();
      }
    };
    xhr.onerror = onFail;
    xhr.ontimeout = onFail;
    xhr.send(JSON.stringify({
      email: email,
      name: name,
      message: message,
      type: type,
      referrer: document.referrer || '',
      ts_token: ts_token
    }));
  });
})();
