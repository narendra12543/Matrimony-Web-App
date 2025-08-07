import fetch from 'node-fetch';

const verifyRecaptcha = async (req, res, next) => {
  console.log('[reCAPTCHA Middleware] Verifying token...');
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
    console.log('[reCAPTCHA Middleware] FAILED: Token is missing.');
    return res.status(400).json({ message: 'reCAPTCHA token is required.' });
  }

  console.log('[reCAPTCHA Middleware] Token length:', recaptchaToken.length);
  console.log('[reCAPTCHA Middleware] Token starts with:', recaptchaToken.substring(0, 10) + '...');

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        console.error('[reCAPTCHA Middleware] FATAL: RECAPTCHA_SECRET_KEY is not set.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;

    const response = await fetch(verificationURL, { method: 'POST' });
    const data = await response.json();

    console.log('[reCAPTCHA Middleware] Google API Response:', data);

    if (data.success) {
      console.log('[reCAPTCHA Middleware] SUCCESS: Token is valid. Proceeding to registration.');
      next();
    } else {
      console.warn('[reCAPTCHA Middleware] FAILED: Token is invalid.', data['error-codes']);
      return res.status(400).json({ 
        error: 'reCAPTCHA verification failed. Please try again.', 
        recaptchaError: true,
        errors: data['error-codes'] 
      });
    }
  } catch (error) {
    console.error('[reCAPTCHA Middleware] ERROR: An exception occurred during verification.', error);
    return res.status(500).json({ message: 'Server error during reCAPTCHA verification.' });
  }
};

export default verifyRecaptcha;
