# 방문 일정 대시보드 (로그인 + RLS)
- 로그인(이메일/비밀번호) 후 사용
- 일정관리에서 추가한 일정은 홈 달력에 즉시 반영 (Supabase Realtime)

## 설정
1) **app.js / login.html** 에서 `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY` 교체
2) Supabase SQL Editor에서 아래 실행 (테이블 + RLS)
```
create table if not exists public.visits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  visit_date date not null,
  start_time time not null,
  end_time time not null,
  half_day text not null,
  purposes text,
  edu_type text,
  etc text,
  school text not null,
  created_at timestamp with time zone default now()
);
alter table public.visits enable row level security;
create policy visits_select on public.visits for select using (auth.uid() = user_id);
create policy visits_insert on public.visits for insert with check (auth.uid() = user_id);
create policy visits_update on public.visits for update using (auth.uid() = user_id);
create policy visits_delete on public.visits for delete using (auth.uid() = user_id);
alter publication supabase_realtime add table public.visits;
```
3) Auth → URL 설정: 배포 도메인 허용

## 로고/사진 교체
- `assets/logo.png` ← 회사 로고로 교체
- `assets/profile.jpg` ← 본인 사진으로 교체
