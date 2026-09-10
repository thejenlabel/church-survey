// 동일인 판정 전수 테스트 — node tests/identity.test.js
const vm = require('vm'), fs = require('fs');
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../config.js', 'utf8'), ctx);
const C = ctx.CFG;
let pass = 0, fail = 0;
const t = (label, got, want) => { if (got === want) pass++; else { fail++; console.log('FAIL', label, 'got', got, 'want', want); } };
const P = '010-9760-3927';           // 기준 전화
const P6 = '010-9760-3900';          // 뒤 8자리 중 6자리 일치
const P5 = '010-9760-0000';          // 5자리 일치
const PX = '010-1111-2222';          // 불일치
const p = (name, phone, birth) => ({ name, phone, birth_year: birth });

// ── 이름 완전 동일 ──
t('같은이름·같은전화·생년 무관', C.samePerson(p('김말숙', P, '1980'), p('김말숙', P, '2025')), true);
t('같은이름·6자리 일치', C.samePerson(p('김말숙', P, ''), p('김말숙', P6, '')), true);
t('같은이름·5자리만 일치', C.samePerson(p('김말숙', P, ''), p('김말숙', P5, '')), false);
t('같은이름·전화 불일치', C.samePerson(p('김말숙', P, '1980'), p('김말숙', PX, '1980')), false);
t('같은이름·한쪽 전화 없음', C.samePerson(p('김말숙', '', '1980'), p('김말숙', P, '1980')), false);
t('같은이름·둘 다 전화 없음', C.samePerson(p('김말숙', '', '1980'), p('김말숙', '', '1980')), false);
t('띄어쓰기 차이는 같은 이름', C.samePerson(p('김 말숙', P, ''), p('김말숙', P, '')), true);

// ── 이름 한 글자 차이(오타 vs 형제) ──
t('오타·생년 같음', C.samePerson(p('윤재동', P, '1973'), p('윤재둥', P, '1973')), true);
t('오타·생년 한쪽 없음', C.samePerson(p('윤재동', P, ''), p('윤재둥', P, '1973')), true);
t('오타·생년 둘 다 없음', C.samePerson(p('윤재동', P, ''), p('윤재둥', P, '')), true);
t('형제·생년 다름 → 다른 사람', C.samePerson(p('윤시온', P, '2002'), p('윤시아', P, '2005')), false);
t('자매(김윤희2016·김윤아2018) → 다른 사람', C.samePerson(p('김윤희', P, '2016'), p('김윤아', P, '2018')), false);
t('한 글자 차이·전화 불일치', C.samePerson(p('윤재동', P, '1973'), p('윤재둥', PX, '1973')), false);
t('한 글자 차이·전화 없음', C.samePerson(p('윤재동', '', '1973'), p('윤재둥', P, '1973')), false);
t('likelyTypo 표시(오타)', C.likelyTypo(p('윤재동', P, '1973'), p('윤재둥', P, '1973')), true);
t('likelyTypo 아님(형제)', C.likelyTypo(p('윤시온', P, '2002'), p('윤시아', P, '2005')), false);
t('likelyTypo 아님(같은 이름)', C.likelyTypo(p('김말숙', P, '1980'), p('김말숙', P, '1980')), false);

// ── 두 글자 이상 차이·길이 다름 ──
t('두 글자 차이', C.samePerson(p('김말숙', P, ''), p('박말순', P, '')), false);
t('길이 다름(김하나·김하나님)', C.samePerson(p('김하나', P, ''), p('김하나님', P, '')), false);
t('두 글자 이름 한 글자 차이·생년 다름', C.samePerson(p('김민', P, '2010'), p('김수', P, '2012')), false);
t('부모 번호로 등록한 이름 다른 아이', C.samePerson(p('윤시온', P, '2002'), p('박효실', P, '1977')), false);

// ── distinct 플래그(예전 데이터 호환) ──
t('distinct면 다른 사람', C.samePerson({ ...p('김말숙', P, ''), distinct: true }, p('김말숙', P, '')), false);

// ── 부서·집계 규칙 ──
t('초등부 2014', C.kidDept('2014'), '초등부'); t('초등부 2019', C.kidDept('2019'), '초등부');
t('유치부 2020', C.kidDept('2020'), '유치부'); t('유치부 2023', C.kidDept('2023'), '유치부');
t('영유아부 2024', C.kidDept('2024'), '영유아부'); t('영유아부 2026', C.kidDept('2026'), '영유아부');
t('성인 부서 없음', C.kidDept('1980'), ''); t('생년 없음 부서 없음', C.kidDept(''), '');
t('2023 집계 포함', C.countsFor({ birth_year: '2023' }), true);
t('2024 집계 제외', C.countsFor({ birth_year: '2024' }), false);
t('생년 없음 집계 포함', C.countsFor({ birth_year: '' }), true);
t('전화 생략 기준 2014', C.PHONE_OPTIONAL_FROM, 2014);
t('식사비 초등생 이상 14000', C.MEAL_FEE.older, 14000); t('식사비 유치부 12000', C.MEAL_FEE.young, 12000);

// ── 전화 서식 ──
t('전화 대시', C.fmtPhone('01097603927'), '010-9760-3927');
t('전화 tail', C.phoneTail('010-9760-3927'), '97603927');
t('phoneMatches 6', C.phoneMatches(P, P6), 6);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
