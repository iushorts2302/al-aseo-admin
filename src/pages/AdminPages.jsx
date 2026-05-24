import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

// ─────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────
export function DashboardPage() {
  const { places, regions, categories, getUsers, getTrips } = useAdmin()
  const users = getUsers()
  const trips = getTrips()

  const stats = [
    { label: '등록 장소',  value: places.length,    icon: '📍', color: '#0066CC' },
    { label: '지역',       value: regions.length,   icon: '🌏', color: '#FF6B35' },
    { label: '카테고리',   value: categories.length,icon: '🏷️', color: '#4DA3FF' },
    { label: '사용자',     value: users.length,     icon: '👥', color: '#28A745' },
    { label: '여행 계획',  value: trips.length,     icon: '🗺️', color: '#FF4500' },
  ]

  // 지역별 장소 분포
  const byRegion = regions.map(r => ({
    name: r.name,
    count: places.filter(p => p.region === r.id).length,
  }))
  // 카테고리별 장소 분포
  const byCategory = categories.map(c => ({
    name: c.name,
    icon: c.icon,
    count: places.filter(p => p.category === c.id).length,
  }))

  return (
    <div className="p-3">
      <h3 className="fw-bold mb-3">대시보드</h3>

      <div className="row g-2 mb-4">
        {stats.map(s => (
          <div key={s.label} className="col-6 col-md-4 col-lg">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3">
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div className="text-muted small mt-1">{s.label}</div>
                <div className="fw-bold" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">지역별 장소</h6>
              {byRegion.map(r => (
                <div key={r.name} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span>{r.name}</span>
                  <span className="badge bg-primary">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">카테고리별 장소</h6>
              {byCategory.map(c => (
                <div key={c.name} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span>{c.icon} {c.name}</span>
                  <span className="badge bg-secondary">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 지역 관리
// ─────────────────────────────────────────────────────
export function RegionManager() {
  const { regions, createRegion, updateRegion, deleteRegion } = useAdmin()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ id: '', name: '', lat: '', lng: '' })

  function openCreate() {
    setEditing('new')
    setForm({ id: '', name: '', lat: '37.5', lng: '127' })
  }
  function openEdit(r) {
    setEditing(r.id)
    setForm({ id: r.id, name: r.name, lat: r.center.lat, lng: r.center.lng })
  }
  function handleSave() {
    if (!form.id || !form.name) return alert('ID와 이름은 필수입니다')
    const data = {
      id: form.id,
      name: form.name,
      center: { lat: Number(form.lat), lng: Number(form.lng) },
    }
    if (editing === 'new') createRegion(data)
    else updateRegion(editing, data)
    setEditing(null)
  }
  function handleDelete(id) {
    if (confirm('정말 삭제하시겠습니까?')) deleteRegion(id)
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">지역 관리</h3>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ 새 지역</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th><th>이름</th><th>중심 좌표</th><th style={{ width: 140 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {regions.map(r => (
                <tr key={r.id}>
                  <td><code>{r.id}</code></td>
                  <td>{r.name}</td>
                  <td className="text-muted small">{r.center.lat}, {r.center.lng}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(r)}>편집</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <SimpleModal title={editing === 'new' ? '새 지역' : '지역 편집'} onClose={() => setEditing(null)}>
          <FormRow label="ID (영문)" value={form.id} onChange={v => setForm(p => ({...p, id: v}))}
                   disabled={editing !== 'new'} />
          <FormRow label="이름" value={form.name} onChange={v => setForm(p => ({...p, name: v}))} />
          <FormRow label="중심 위도" type="number" value={form.lat} onChange={v => setForm(p => ({...p, lat: v}))} />
          <FormRow label="중심 경도" type="number" value={form.lng} onChange={v => setForm(p => ({...p, lng: v}))} />
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setEditing(null)}>취소</button>
            <button className="btn btn-primary flex-grow-1" onClick={handleSave}>저장</button>
          </div>
        </SimpleModal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 카테고리 관리
// ─────────────────────────────────────────────────────
export function CategoryManager() {
  const { categories, createCategory, updateCategory, deleteCategory } = useAdmin()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ id: '', name: '', icon: '' })

  function openCreate() { setEditing('new'); setForm({ id: '', name: '', icon: '📌' }) }
  function openEdit(c) { setEditing(c.id); setForm(c) }
  function handleSave() {
    if (!form.id || !form.name) return alert('ID와 이름은 필수입니다')
    if (editing === 'new') createCategory(form)
    else updateCategory(editing, form)
    setEditing(null)
  }
  function handleDelete(id) {
    if (confirm('정말 삭제하시겠습니까?')) deleteCategory(id)
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">카테고리 관리</h3>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ 새 카테고리</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead className="table-light">
              <tr><th>아이콘</th><th>ID</th><th>이름</th><th style={{ width: 140 }}>관리</th></tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td style={{ fontSize: 20 }}>{c.icon}</td>
                  <td><code>{c.id}</code></td>
                  <td>{c.name}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(c)}>편집</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <SimpleModal title={editing === 'new' ? '새 카테고리' : '카테고리 편집'} onClose={() => setEditing(null)}>
          <FormRow label="ID (영문)" value={form.id} onChange={v => setForm(p => ({...p, id: v}))}
                   disabled={editing !== 'new'} />
          <FormRow label="이름" value={form.name} onChange={v => setForm(p => ({...p, name: v}))} />
          <FormRow label="아이콘 (이모지)" value={form.icon} onChange={v => setForm(p => ({...p, icon: v}))} />
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setEditing(null)}>취소</button>
            <button className="btn btn-primary flex-grow-1" onClick={handleSave}>저장</button>
          </div>
        </SimpleModal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 장소 관리
// ─────────────────────────────────────────────────────
export function PlaceManager() {
  const { places, placesLoading, regions, categories,
          createPlace, updatePlace, deletePlace, syncTourPlaces } = useAdmin()
  const [filter, setFilter] = useState({ region: 'all', category: 'all', status: 'all', query: '' })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  // TourAPI 수집 모달
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncForm, setSyncForm] = useState({ areaCode: 39, contentTypeId: 12, pageNo: 1, numOfRows: 30 })
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [syncError, setSyncError] = useState('')

  // row별 진행 상태. key=place.id, value='approving'|'rejecting'|'deleting'|null.
  // 작업 중인 row의 모든 버튼은 disabled + 진행 버튼엔 스피너.
  const [rowBusy, setRowBusy] = useState({})
  // 작업 결과를 화면 하단에 잠시 표시 (가벼운 토스트)
  const [toast, setToast] = useState(null)  // { type: 'success'|'error', text }
  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 2500)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    setSyncError('')
    try {
      const result = await syncTourPlaces(syncForm)
      setSyncResult(result)
    } catch (err) {
      setSyncError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  async function handleApprove(p) {
    setRowBusy(b => ({ ...b, [p.id]: 'approving' }))
    try {
      await updatePlace(p.id, { reviewStatus: 'approved' })
      showToast('success', `✓ "${p.name}" 승인됨`)
    } catch (err) {
      showToast('error', `승인 실패: ${err.message}`)
    } finally {
      setRowBusy(b => { const n = { ...b }; delete n[p.id]; return n })
    }
  }
  async function handleReject(p) {
    if (!confirm(`"${p.name}"을(를) 거부하시겠어요? 사용자 웹에 노출되지 않습니다.`)) return
    setRowBusy(b => ({ ...b, [p.id]: 'rejecting' }))
    try {
      await updatePlace(p.id, { reviewStatus: 'rejected' })
      showToast('success', `"${p.name}" 거부됨`)
    } catch (err) {
      showToast('error', `거부 실패: ${err.message}`)
    } finally {
      setRowBusy(b => { const n = { ...b }; delete n[p.id]; return n })
    }
  }
  async function handleDelete(p) {
    if (!confirm(`"${p.name}"을(를) 삭제하시겠어요?`)) return
    setRowBusy(b => ({ ...b, [p.id]: 'deleting' }))
    try {
      await deletePlace(p.id)
      showToast('success', `"${p.name}" 삭제됨`)
    } catch (err) {
      showToast('error', `삭제 실패: ${err.message}`)
    } finally {
      setRowBusy(b => { const n = { ...b }; delete n[p.id]; return n })
    }
  }

  function openCreate() {
    setEditing('new')
    setForm({
      name: '', region: regions[0]?.id || 'jeju', category: categories[0]?.id || 'food',
      lat: 33.5, lng: 126.5, photo: '', rating: 4.5, reviewCount: 0,
      priceLevel: 2, duration: 60, desc: '', tags: '',
    })
  }
  function openEdit(p) {
    setEditing(p.id)
    setForm({ ...p, tags: (p.tags || []).join(', ') })
  }
  async function handleSave() {
    if (!form.name) return alert('이름은 필수입니다')
    const data = {
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      priceLevel: Number(form.priceLevel),
      duration: Number(form.duration),
      tags: typeof form.tags === 'string'
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : form.tags,
    }
    try {
      if (editing === 'new') {
        await createPlace(data)
        showToast('success', `✓ "${data.name}" 추가됨`)
      } else {
        await updatePlace(editing, data)
        showToast('success', `✓ "${data.name}" 저장됨`)
      }
      setEditing(null)
    } catch (err) {
      showToast('error', `저장 실패: ${err.message}`)
    }
  }

  const filtered = places
    .filter(p => filter.region === 'all' || p.region === filter.region)
    .filter(p => filter.category === 'all' || p.category === filter.category)
    .filter(p => filter.status === 'all' || (p.reviewStatus || 'approved') === filter.status)
    .filter(p => !filter.query || p.name.includes(filter.query))

  const pendingCount = places.filter(p => (p.reviewStatus || 'approved') === 'pending').length

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="fw-bold mb-0">
          장소 관리 ({filtered.length} / {places.length})
          {pendingCount > 0 && (
            <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7em' }}>
              검토 대기 {pendingCount}
            </span>
          )}
        </h3>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={() => setSyncOpen(true)}>
            🌐 TourAPI 수집
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ 새 장소</button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-3 col-6">
              <select className="form-select form-select-sm" value={filter.region}
                      onChange={e => setFilter(p => ({...p, region: e.target.value}))}>
                <option value="all">전체 지역</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 col-6">
              <select className="form-select form-select-sm" value={filter.category}
                      onChange={e => setFilter(p => ({...p, category: e.target.value}))}>
                <option value="all">전체 카테고리</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 col-6">
              <select className="form-select form-select-sm" value={filter.status}
                      onChange={e => setFilter(p => ({...p, status: e.target.value}))}>
                <option value="all">전체 상태</option>
                <option value="pending">⏳ 검토 대기</option>
                <option value="approved">✓ 승인됨</option>
                <option value="rejected">✗ 거부됨</option>
              </select>
            </div>
            <div className="col-md-3 col-6">
              <input className="form-control form-control-sm" placeholder="이름 검색"
                     value={filter.query}
                     onChange={e => setFilter(p => ({...p, query: e.target.value}))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>이름</th><th>지역</th><th>카테고리</th>
                <th>평점</th><th>상태</th><th style={{ width: 200 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const region = regions.find(r => r.id === p.region)
                const cat = categories.find(c => c.id === p.category)
                const status = p.reviewStatus || 'approved'
                const busy = rowBusy[p.id]  // 'approving'|'rejecting'|'deleting'|undefined
                const anyBusy = !!busy
                return (
                  <tr key={p.id} style={anyBusy ? { opacity: 0.6 } : undefined}>
                    <td>
                      <div className="fw-semibold">
                        {p.name}
                        {p.externalId && (
                          <span className="badge bg-info text-dark ms-1" style={{ fontSize: '0.65em' }}>
                            TourAPI
                          </span>
                        )}
                      </div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: 300 }}>{p.desc}</div>
                    </td>
                    <td>{region?.name}</td>
                    <td>{cat?.icon} {cat?.name}</td>
                    <td>⭐ {p.rating} ({p.reviewCount})</td>
                    <td>
                      {status === 'pending'  && <span className="badge bg-warning text-dark">⏳ 대기</span>}
                      {status === 'approved' && <span className="badge bg-success">✓ 승인</span>}
                      {status === 'rejected' && <span className="badge bg-secondary">✗ 거부</span>}
                    </td>
                    <td>
                      {status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-success me-1"
                                  disabled={anyBusy}
                                  onClick={() => handleApprove(p)}>
                            {busy === 'approving' ? (
                              <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12 }} />처리 중</>
                            ) : '승인'}
                          </button>
                          <button className="btn btn-sm btn-outline-secondary me-1"
                                  disabled={anyBusy}
                                  onClick={() => handleReject(p)}>
                            {busy === 'rejecting' ? (
                              <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12 }} />처리 중</>
                            ) : '거부'}
                          </button>
                        </>
                      )}
                      <button className="btn btn-sm btn-outline-primary me-1"
                              disabled={anyBusy}
                              onClick={() => openEdit(p)}>편집</button>
                      <button className="btn btn-sm btn-outline-danger"
                              disabled={anyBusy}
                              onClick={() => handleDelete(p)}>
                        {busy === 'deleting' ? (
                          <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12 }} />처리 중</>
                        ) : '삭제'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-4">
                  {placesLoading ? '불러오는 중...' : '조건에 맞는 장소가 없습니다'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <SimpleModal title={editing === 'new' ? '새 장소' : '장소 편집'}
                     onClose={() => setEditing(null)} large>
          <FormRow label="이름" value={form.name} onChange={v => setForm(p => ({...p, name: v}))} />
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small fw-semibold">지역</label>
              <select className="form-select" value={form.region}
                      onChange={e => setForm(p => ({...p, region: e.target.value}))}>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">카테고리</label>
              <select className="form-select" value={form.category}
                      onChange={e => setForm(p => ({...p, category: e.target.value}))}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="row g-2 mt-1">
            <div className="col-6">
              <FormRow label="위도" type="number" value={form.lat} onChange={v => setForm(p => ({...p, lat: v}))} />
            </div>
            <div className="col-6">
              <FormRow label="경도" type="number" value={form.lng} onChange={v => setForm(p => ({...p, lng: v}))} />
            </div>
          </div>
          <div className="d-flex justify-content-end mb-2">
            <a className={`btn btn-sm btn-outline-success ${
                  Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lng)) ? '' : 'disabled'
                }`}
               href={`https://map.naver.com/p?lng=${form.lng}&lat=${form.lat}&zoom=16`}
               target="_blank" rel="noopener noreferrer"
               style={{ textDecoration: 'none' }}>
              📍 네이버 지도에서 위치 미리보기
            </a>
          </div>
          <FormRow label="사진 URL" value={form.photo} onChange={v => setForm(p => ({...p, photo: v}))} />
          <div className="row g-2">
            <div className="col-4">
              <FormRow label="평점" type="number" value={form.rating} onChange={v => setForm(p => ({...p, rating: v}))} />
            </div>
            <div className="col-4">
              <FormRow label="리뷰수" type="number" value={form.reviewCount} onChange={v => setForm(p => ({...p, reviewCount: v}))} />
            </div>
            <div className="col-4">
              <FormRow label="가격등급 (1~3)" type="number" value={form.priceLevel} onChange={v => setForm(p => ({...p, priceLevel: v}))} />
            </div>
          </div>
          <FormRow label="소요시간 (분)" type="number" value={form.duration} onChange={v => setForm(p => ({...p, duration: v}))} />
          <FormRow label="설명" value={form.desc} onChange={v => setForm(p => ({...p, desc: v}))} />
          <FormRow label="태그 (쉼표 구분)" value={form.tags} onChange={v => setForm(p => ({...p, tags: v}))} />
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setEditing(null)}>취소</button>
            <button className="btn btn-primary flex-grow-1" onClick={handleSave}>저장</button>
          </div>
        </SimpleModal>
      )}

      {syncOpen && (
        <SimpleModal title="🌐 TourAPI 자동 수집" onClose={() => { if (!syncing) setSyncOpen(false) }}>
          <p className="small text-muted">
            한국관광공사 TourAPI에서 장소 데이터를 가져옵니다.
            수집된 장소는 <strong>검토 대기</strong> 상태로 저장되며, 관리자가 승인해야 사용자 웹에 노출됩니다.
          </p>
          <div className="row g-2 mt-2">
            <div className="col-6">
              <label className="form-label small">지역</label>
              <select className="form-select form-select-sm"
                      value={syncForm.areaCode}
                      disabled={syncing}
                      onChange={e => setSyncForm(p => ({...p, areaCode: Number(e.target.value)}))}>
                <option value={1}>서울</option>
                <option value={6}>부산</option>
                <option value={39}>제주</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small">콘텐츠 타입</label>
              <select className="form-select form-select-sm"
                      value={syncForm.contentTypeId}
                      disabled={syncing}
                      onChange={e => setSyncForm(p => ({...p, contentTypeId: Number(e.target.value)}))}>
                <option value={12}>관광지 → sight</option>
                <option value={14}>문화시설 → sight</option>
                <option value={15}>축제/공연 → activity</option>
                <option value={28}>레포츠 → activity</option>
                <option value={32}>숙박 → stay</option>
                <option value={39}>음식점 → food (카페 자동 분류)</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small">페이지 번호</label>
              <input className="form-control form-control-sm" type="number" min="1"
                     value={syncForm.pageNo}
                     disabled={syncing}
                     onChange={e => setSyncForm(p => ({...p, pageNo: Number(e.target.value)}))} />
            </div>
            <div className="col-6">
              <label className="form-label small">페이지당 건수 (최대 100)</label>
              <input className="form-control form-control-sm" type="number" min="1" max="100"
                     value={syncForm.numOfRows}
                     disabled={syncing}
                     onChange={e => setSyncForm(p => ({...p, numOfRows: Number(e.target.value)}))} />
            </div>
          </div>

          {syncError && (
            <div className="alert alert-danger py-1 small mt-2">{syncError}</div>
          )}
          {syncResult && (
            <div className="alert alert-success py-2 small mt-2">
              ✓ 수집 완료<br />
              가져온 건수: <strong>{syncResult.fetched}</strong> /
              신규 등록: <strong>{syncResult.inserted}</strong> /
              건너뜀: <strong>{syncResult.skipped}</strong>
              {syncResult.totalCount > 0 && (
                <span className="text-muted"> (TourAPI 총 {syncResult.totalCount}건)</span>
              )}
              <br />
              <span className="text-muted">필터의 '⏳ 검토 대기'에서 확인하세요.</span>
            </div>
          )}

          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary flex-grow-1"
                    disabled={syncing}
                    onClick={() => setSyncOpen(false)}>
              {syncResult ? '닫기' : '취소'}
            </button>
            <button className="btn btn-success flex-grow-1"
                    disabled={syncing}
                    onClick={handleSync}>
              {syncing ? '수집 중...' : '수집 시작'}
            </button>
          </div>
        </SimpleModal>
      )}

      {/* 액션 결과 토스트 — 화면 우측 하단 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1100,
          padding: '12px 18px',
          borderRadius: 8,
          background: toast.type === 'success' ? '#198754' : '#dc3545',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          fontSize: 14,
          fontWeight: 500,
          maxWidth: 'calc(100vw - 48px)',
          animation: 'al-toast-in 0.2s ease-out',
        }}>
          {toast.text}
        </div>
      )}
      <style>{`
        @keyframes al-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 사용자 (읽기 전용)
// ─────────────────────────────────────────────────────
export function UserManager() {
  const { getUsers } = useAdmin()
  const users = getUsers()

  return (
    <div className="p-3">
      <h3 className="fw-bold mb-3">사용자 관리 ({users.length}명)</h3>
      <div className="alert alert-info py-2 small">
        ℹ️ 사용자 데이터는 localStorage 기반이며 읽기 전용입니다.
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead className="table-light">
              <tr><th>닉네임</th><th>이메일</th><th>가입일</th><th>제공자</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-muted py-4">등록된 사용자가 없습니다</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td className="fw-semibold">{u.nickname}</td>
                  <td className="text-muted small">{u.email}</td>
                  <td className="text-muted small">{u.createdAt?.slice(0, 10)}</td>
                  <td>{u.provider ? <span className="badge bg-secondary">{u.provider}</span> : <span className="text-muted small">이메일</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 여행 계획 (읽기 전용)
// ─────────────────────────────────────────────────────
export function TripManager() {
  const { getTrips, regions } = useAdmin()
  const trips = getTrips()

  return (
    <div className="p-3">
      <h3 className="fw-bold mb-3">여행 계획 관리 ({trips.length}건)</h3>
      <div className="alert alert-info py-2 small">
        ℹ️ 사용자 여행 데이터는 localStorage 기반이며 읽기 전용입니다.
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead className="table-light">
              <tr><th>제목</th><th>지역</th><th>기간</th><th>목적</th><th>일정수</th></tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted py-4">등록된 여행이 없습니다</td></tr>
              ) : trips.map(t => {
                const region = regions.find(r => r.id === t.region)
                const itemCount = t.days?.reduce((sum, d) =>
                  sum + (d.slots?.morning?.length || 0)
                      + (d.slots?.afternoon?.length || 0)
                      + (d.slots?.evening?.length || 0), 0) || 0
                return (
                  <tr key={t.id}>
                    <td className="fw-semibold">{t.title}</td>
                    <td>{region?.name || t.region}</td>
                    <td className="text-muted small">{t.startDate} ~ {t.endDate}</td>
                    <td><span className="badge bg-light text-dark">{t.purpose}</span></td>
                    <td>{itemCount}곳</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 공통 컴포넌트
// ─────────────────────────────────────────────────────
function SimpleModal({ title, children, onClose, large }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div className="card shadow"
           style={{ maxWidth: large ? 600 : 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
           onClick={e => e.stopPropagation()}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">{title}</h6>
          <button className="btn-close" onClick={onClose} aria-label="닫기" />
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  )
}

function FormRow({ label, value, onChange, type = 'text', disabled }) {
  return (
    <div className="mb-2">
      <label className="form-label small fw-semibold">{label}</label>
      <input className="form-control form-control-sm" type={type}
             value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} />
    </div>
  )
}
