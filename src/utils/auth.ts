import { SignJWT, jwtVerify } from 'jose';

// JWT 암호화에 사용할 시크릿 키를 반환합니다.
// 환경 변수에 JWT_SECRET이 없으면 ADMIN_PASSWORD를 임시로 사용합니다.
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('JWT Secret key is not set');
  }
  return new TextEncoder().encode(secret);
};

export async function signAdminToken() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // 쿠키의 maxAge와 동일하게 1일로 설정
    .sign(getJwtSecretKey());
  
  return token;
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload?.role === 'admin';
  } catch (error) {
    return false; // 서명이 유효하지 않거나 만료된 토큰
  }
}