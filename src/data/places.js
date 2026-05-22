// Mock 장소 데이터 — 제주 25 + 서울 10 + 부산 10 = 45개
// 좌표는 실제 위치 근사값 (지도 mock용)
// 이미지는 Unsplash 무료 URL

export const REGIONS = [
  { id: 'jeju',  name: '제주', center: { lat: 33.4890, lng: 126.4983 } },
  { id: 'seoul', name: '서울', center: { lat: 37.5665, lng: 126.9780 } },
  { id: 'busan', name: '부산', center: { lat: 35.1796, lng: 129.0756 } },
]

export const CATEGORIES = [
  { id: 'food',     name: '맛집',    icon: '🍽️' },
  { id: 'cafe',     name: '카페',    icon: '☕' },
  { id: 'activity', name: '액티비티', icon: '🎯' },
  { id: 'sight',    name: '명소',    icon: '🏞️' },
  { id: 'stay',     name: '숙소',    icon: '🏨' },
  { id: 'spa',      name: '스파',    icon: '💆' },
]

// 가격 등급: 1=저렴, 2=보통, 3=고급
// 소요시간: 분 단위
export const PLACES = [
  // ───────── 제주 (25) ─────────
  // 맛집 8
  { id: 'p001', region: 'jeju', category: 'food', name: '갈치조림 전문점', lat: 33.4996, lng: 126.5312, photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', rating: 4.6, reviewCount: 1240, priceLevel: 2, duration: 60, tags: ['해산물','로컬'], desc: '제주 대표 갈치조림 맛집' },
  { id: 'p002', region: 'jeju', category: 'food', name: '흑돼지 구이집', lat: 33.5104, lng: 126.5219, photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', rating: 4.7, reviewCount: 2103, priceLevel: 3, duration: 90, tags: ['고기','로컬'], desc: '두툼한 제주 흑돼지' },
  { id: 'p003', region: 'jeju', category: 'food', name: '성게비빔밥집', lat: 33.4530, lng: 126.9180, photo: 'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=400', rating: 4.5, reviewCount: 890, priceLevel: 2, duration: 50, tags: ['해산물'], desc: '성산일출봉 인근 성게비빔밥' },
  { id: 'p004', region: 'jeju', category: 'food', name: '고기국수 노포', lat: 33.5141, lng: 126.5258, photo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', rating: 4.4, reviewCount: 1560, priceLevel: 1, duration: 40, tags: ['국수','로컬'], desc: '제주식 고기국수' },
  { id: 'p005', region: 'jeju', category: 'food', name: '해녀의 집', lat: 33.4308, lng: 126.6253, photo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', rating: 4.3, reviewCount: 720, priceLevel: 2, duration: 60, tags: ['해산물','뷰맛집'], desc: '해녀가 직접 잡은 해산물' },
  { id: 'p006', region: 'jeju', category: 'food', name: '딱새우 회집', lat: 33.4996, lng: 126.5500, photo: 'https://images.unsplash.com/photo-1635146037526-a75e6905ad78?w=400', rating: 4.6, reviewCount: 980, priceLevel: 3, duration: 80, tags: ['회','해산물'], desc: '신선한 딱새우' },
  { id: 'p007', region: 'jeju', category: 'food', name: '몸국 전문', lat: 33.5066, lng: 126.4920, photo: 'https://images.unsplash.com/photo-1576020799627-aeac74d58064?w=400', rating: 4.2, reviewCount: 540, priceLevel: 1, duration: 35, tags: ['국','로컬'], desc: '제주 향토음식 몸국' },
  { id: 'p008', region: 'jeju', category: 'food', name: '오겹살 화로구이', lat: 33.4860, lng: 126.4980, photo: 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=400', rating: 4.5, reviewCount: 1430, priceLevel: 3, duration: 90, tags: ['고기'], desc: '숯불 오겹살' },

  // 카페 5
  { id: 'p009', region: 'jeju', category: 'cafe', name: '오션뷰 카페 SEA', lat: 33.4520, lng: 126.9220, photo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', rating: 4.7, reviewCount: 3200, priceLevel: 2, duration: 60, tags: ['뷰맛집','오션뷰'], desc: '바다가 보이는 통유리 카페' },
  { id: 'p010', region: 'jeju', category: 'cafe', name: '돌담 정원 카페', lat: 33.3850, lng: 126.6720, photo: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400', rating: 4.5, reviewCount: 1800, priceLevel: 2, duration: 50, tags: ['감성','정원'], desc: '제주 돌담과 정원' },
  { id: 'p011', region: 'jeju', category: 'cafe', name: '한라봉 디저트 카페', lat: 33.4790, lng: 126.4540, photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', rating: 4.4, reviewCount: 920, priceLevel: 2, duration: 40, tags: ['디저트'], desc: '한라봉 케이크 시그니처' },
  { id: 'p012', region: 'jeju', category: 'cafe', name: '바람코지 베이커리', lat: 33.4060, lng: 126.2680, photo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400', rating: 4.6, reviewCount: 2100, priceLevel: 2, duration: 45, tags: ['베이커리','뷰맛집'], desc: '서쪽 해안 베이커리' },
  { id: 'p013', region: 'jeju', category: 'cafe', name: '책방 카페', lat: 33.3260, lng: 126.6800, photo: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=400', rating: 4.3, reviewCount: 670, priceLevel: 2, duration: 70, tags: ['감성','조용한'], desc: '책과 함께하는 조용한 카페' },

  // 액티비티 6
  { id: 'p014', region: 'jeju', category: 'activity', name: '한라산 어승생악 트레킹', lat: 33.4030, lng: 126.4880, photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400', rating: 4.6, reviewCount: 1400, priceLevel: 1, duration: 180, tags: ['등산','자연'], desc: '한라산 입문 코스' },
  { id: 'p015', region: 'jeju', category: 'activity', name: '우도 자전거 투어', lat: 33.5066, lng: 126.9520, photo: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400', rating: 4.5, reviewCount: 980, priceLevel: 2, duration: 150, tags: ['자전거','섬'], desc: '우도 한 바퀴 자전거' },
  { id: 'p016', region: 'jeju', category: 'activity', name: '협재 스노클링', lat: 33.3940, lng: 126.2400, photo: 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=400', rating: 4.4, reviewCount: 720, priceLevel: 2, duration: 90, tags: ['해양','여름'], desc: '에메랄드빛 협재 해변' },
  { id: 'p017', region: 'jeju', category: 'activity', name: '제주 승마장', lat: 33.3650, lng: 126.4530, photo: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400', rating: 4.2, reviewCount: 560, priceLevel: 3, duration: 60, tags: ['승마','체험'], desc: '초원에서 승마 체험' },
  { id: 'p018', region: 'jeju', category: 'activity', name: '카약 투어', lat: 33.4380, lng: 126.9180, photo: 'https://images.unsplash.com/photo-1572125675722-238a4e2a52f3?w=400', rating: 4.5, reviewCount: 410, priceLevel: 2, duration: 120, tags: ['해양','체험'], desc: '성산 일대 카약 투어' },
  { id: 'p019', region: 'jeju', category: 'activity', name: '오름 산책 (새별오름)', lat: 33.3640, lng: 126.3570, photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400', rating: 4.7, reviewCount: 2400, priceLevel: 1, duration: 90, tags: ['산책','자연'], desc: '제주 대표 오름' },

  // 명소 4
  { id: 'p020', region: 'jeju', category: 'sight', name: '성산일출봉', lat: 33.4581, lng: 126.9425, photo: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400', rating: 4.7, reviewCount: 5800, priceLevel: 1, duration: 90, tags: ['유네스코','일출'], desc: '유네스코 세계자연유산' },
  { id: 'p021', region: 'jeju', category: 'sight', name: '만장굴', lat: 33.5283, lng: 126.7714, photo: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=400', rating: 4.4, reviewCount: 2100, priceLevel: 1, duration: 60, tags: ['용암동굴'], desc: '세계 최장 용암동굴' },
  { id: 'p022', region: 'jeju', category: 'sight', name: '천지연 폭포', lat: 33.2470, lng: 126.5570, photo: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400', rating: 4.5, reviewCount: 3400, priceLevel: 1, duration: 50, tags: ['폭포'], desc: '서귀포 대표 폭포' },
  { id: 'p023', region: 'jeju', category: 'sight', name: '협재 해수욕장', lat: 33.3940, lng: 126.2400, photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', rating: 4.6, reviewCount: 4500, priceLevel: 1, duration: 90, tags: ['해변'], desc: '에메랄드빛 해변' },

  // 숙소 2
  { id: 'p024', region: 'jeju', category: 'stay', name: '제주 오션뷰 호텔', lat: 33.4996, lng: 126.5400, photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', rating: 4.5, reviewCount: 1230, priceLevel: 3, duration: 0, tags: ['호텔','오션뷰'], desc: '시내 오션뷰 4성급' },
  { id: 'p025', region: 'jeju', category: 'stay', name: '돌집 게스트하우스', lat: 33.4520, lng: 126.9180, photo: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', rating: 4.3, reviewCount: 540, priceLevel: 2, duration: 0, tags: ['게하','감성'], desc: '제주 전통 돌집 개조 게하' },

  // ───────── 서울 (10) ─────────
  // 맛집 3
  { id: 'p026', region: 'seoul', category: 'food', name: '광장시장 빈대떡', lat: 37.5703, lng: 126.9994, photo: 'https://images.unsplash.com/photo-1583224874284-d3e6c4720cf6?w=400', rating: 4.4, reviewCount: 8200, priceLevel: 1, duration: 40, tags: ['전통','시장'], desc: '서울 대표 시장 음식' },
  { id: 'p027', region: 'seoul', category: 'food', name: '북촌 한정식', lat: 37.5826, lng: 126.9836, photo: 'https://images.unsplash.com/photo-1580651315530-69c8e0903883?w=400', rating: 4.7, reviewCount: 1820, priceLevel: 3, duration: 90, tags: ['한식','정찬'], desc: '북촌 한정식 코스' },
  { id: 'p028', region: 'seoul', category: 'food', name: '을지로 노가리집', lat: 37.5664, lng: 126.9923, photo: 'https://images.unsplash.com/photo-1542528180-a1208c5169a5?w=400', rating: 4.5, reviewCount: 3400, priceLevel: 2, duration: 60, tags: ['술집','로컬'], desc: '을지로 노가리 골목' },

  // 카페 3
  { id: 'p029', region: 'seoul', category: 'cafe', name: '성수동 로스터리', lat: 37.5444, lng: 127.0560, photo: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400', rating: 4.5, reviewCount: 2100, priceLevel: 2, duration: 50, tags: ['커피','감성'], desc: '성수동 스페셜티 커피' },
  { id: 'p030', region: 'seoul', category: 'cafe', name: '북촌 한옥 카페', lat: 37.5816, lng: 126.9856, photo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400', rating: 4.6, reviewCount: 1450, priceLevel: 2, duration: 60, tags: ['한옥','감성'], desc: '한옥에서 즐기는 차' },
  { id: 'p031', region: 'seoul', category: 'cafe', name: '연남동 디저트', lat: 37.5610, lng: 126.9239, photo: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', rating: 4.4, reviewCount: 980, priceLevel: 2, duration: 40, tags: ['디저트'], desc: '연남동 시그니처 디저트' },

  // 명소 3
  { id: 'p032', region: 'seoul', category: 'sight', name: '경복궁', lat: 37.5796, lng: 126.9770, photo: 'https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?w=400', rating: 4.7, reviewCount: 12400, priceLevel: 1, duration: 120, tags: ['궁궐','역사'], desc: '조선왕조 정궁' },
  { id: 'p033', region: 'seoul', category: 'sight', name: '남산서울타워', lat: 37.5512, lng: 126.9882, photo: 'https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=400', rating: 4.5, reviewCount: 8900, priceLevel: 2, duration: 90, tags: ['전망','야경'], desc: '서울 시내 전망' },
  { id: 'p034', region: 'seoul', category: 'sight', name: '한강공원 (반포)', lat: 37.5114, lng: 126.9959, photo: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400', rating: 4.6, reviewCount: 4500, priceLevel: 1, duration: 60, tags: ['공원','산책'], desc: '한강 무지개분수' },

  // 숙소 1
  { id: 'p035', region: 'seoul', category: 'stay', name: '명동 비즈니스 호텔', lat: 37.5635, lng: 126.9826, photo: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400', rating: 4.3, reviewCount: 2100, priceLevel: 3, duration: 0, tags: ['호텔','시내'], desc: '명동 중심 4성급' },

  // ───────── 부산 (10) ─────────
  // 맛집 3
  { id: 'p036', region: 'busan', category: 'food', name: '자갈치 회집', lat: 35.0966, lng: 129.0306, photo: 'https://images.unsplash.com/photo-1583224874284-d3e6c4720cf6?w=400', rating: 4.5, reviewCount: 3200, priceLevel: 2, duration: 70, tags: ['회','시장'], desc: '자갈치시장 신선한 회' },
  { id: 'p037', region: 'busan', category: 'food', name: '돼지국밥 노포', lat: 35.1538, lng: 129.0596, photo: 'https://images.unsplash.com/photo-1582878826629-d04ed8b3d54e?w=400', rating: 4.4, reviewCount: 2100, priceLevel: 1, duration: 35, tags: ['국밥','로컬'], desc: '부산 대표 돼지국밥' },
  { id: 'p038', region: 'busan', category: 'food', name: '밀면 전문', lat: 35.1668, lng: 129.0700, photo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', rating: 4.3, reviewCount: 1240, priceLevel: 1, duration: 30, tags: ['면','로컬'], desc: '부산 밀면' },

  // 카페 2
  { id: 'p039', region: 'busan', category: 'cafe', name: '광안리 오션 카페', lat: 35.1532, lng: 129.1186, photo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', rating: 4.6, reviewCount: 1800, priceLevel: 2, duration: 60, tags: ['오션뷰'], desc: '광안대교 뷰 카페' },
  { id: 'p040', region: 'busan', category: 'cafe', name: '전포동 로스터리', lat: 35.1532, lng: 129.0660, photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', rating: 4.4, reviewCount: 920, priceLevel: 2, duration: 50, tags: ['커피','감성'], desc: '전포 카페거리' },

  // 액티비티 2
  { id: 'p041', region: 'busan', category: 'activity', name: '해운대 서핑', lat: 35.1588, lng: 129.1604, photo: 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=400', rating: 4.5, reviewCount: 720, priceLevel: 2, duration: 120, tags: ['해양','서핑'], desc: '해운대 서핑 강습' },
  { id: 'p042', region: 'busan', category: 'activity', name: '감천문화마을 산책', lat: 35.0975, lng: 129.0103, photo: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400', rating: 4.6, reviewCount: 3400, priceLevel: 1, duration: 90, tags: ['산책','감성'], desc: '부산의 마추픽추' },

  // 명소 2
  { id: 'p043', region: 'busan', category: 'sight', name: '해동용궁사', lat: 35.1882, lng: 129.2229, photo: 'https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?w=400', rating: 4.5, reviewCount: 4500, priceLevel: 1, duration: 60, tags: ['사찰','해안'], desc: '바닷가 사찰' },
  { id: 'p044', region: 'busan', category: 'sight', name: '광안대교 야경', lat: 35.1462, lng: 129.1188, photo: 'https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=400', rating: 4.7, reviewCount: 5800, priceLevel: 1, duration: 60, tags: ['야경'], desc: '광안리 야경 명소' },

  // 숙소 1
  { id: 'p045', region: 'busan', category: 'stay', name: '해운대 리조트', lat: 35.1588, lng: 129.1604, photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', rating: 4.5, reviewCount: 1820, priceLevel: 3, duration: 0, tags: ['리조트','오션뷰'], desc: '해운대 오션뷰 리조트' },
]

export const MOODS = [
  { id: 'excited', label: '신남',   emoji: '🤩' },
  { id: 'normal',  label: '보통',   emoji: '😊' },
  { id: 'down',    label: '우울',   emoji: '😔' },
]

export const VIBES = [
  { id: 'active',  label: '활동적', emoji: '⚡' },
  { id: 'chill',   label: '여유',   emoji: '🌿' },
  { id: 'romantic',label: '낭만',   emoji: '💕' },
  { id: 'foodie',  label: '미식',   emoji: '🍷' },
]

export const HEALTHS = [
  { id: 'energetic', label: '활기참', emoji: '💪' },
  { id: 'normal',    label: '정상',   emoji: '🙂' },
  { id: 'tired',     label: '피곤함', emoji: '😴' },
  { id: 'sick',      label: '아픔',   emoji: '🤒' },
]

export const COMPANIONS = [
  { id: 'solo',    label: '혼자',           emoji: '🚶' },
  { id: 'couple',  label: '연인',           emoji: '💑' },
  { id: 'friends', label: '친구',           emoji: '👯' },
  { id: 'family',  label: '가족',           emoji: '👨‍👩‍👧' },
  { id: 'family_kid', label: '가족(아이)', emoji: '👶' },
]

export const PURPOSES = [
  { id: 'healing',  label: '힐링',     emoji: '🌊' },
  { id: 'activity', label: '액티비티', emoji: '🏄' },
  { id: 'food',     label: '미식',     emoji: '🍴' },
  { id: 'culture',  label: '문화',     emoji: '🏛️' },
  { id: 'shopping', label: '쇼핑',     emoji: '🛍️' },
]
