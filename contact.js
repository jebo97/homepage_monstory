// 문의하기 폼 제출 처리
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var msg = document.getElementById('cf-msg');
  var submitBtn = document.getElementById('cf-submit');

  function setMsg(text, kind) {
    msg.textContent = text;
    msg.className = 'form-msg' + (kind ? ' ' + kind : '');
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

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setMsg('', '');

    var name = document.getElementById('cf-name').value.trim();
    var email = document.getElementById('cf-email').value.trim();
    var message = document.getElementById('cf-message').value.trim();

    if (!name || !email || !message) {
      setMsg('이름·이메일·문의 내용을 모두 입력해 주세요.', 'err');
      return;
    }

    var ts_token = getTurnstileToken();
    if (!ts_token) {
      setMsg('보안 확인이 완료되지 않았어요. 잠시 후 다시 시도해 주세요.', 'err');
      return;
    }

    var origLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중…';

    try {
      var res = await fetch('https://monstory.app/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name,
          message: message,
          type: 'homepage',
          referrer: document.referrer || '',
          ts_token: ts_token
        })
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      setMsg('문의가 접수되었어요. 빠르게 답변드릴게요!', 'ok');
      form.reset();
      resetTurnstile();
    } catch (err) {
      setMsg('전송에 실패했어요. 잠시 후 다시 시도해 주세요.', 'err');
      resetTurnstile();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = origLabel;
    }
  });
})();
