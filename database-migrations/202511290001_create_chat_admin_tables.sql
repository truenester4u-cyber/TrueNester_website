begin;

create extension if not exists "uuid-ossp";

create table if not exists public.agents (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text,
  department text,
  photo_url text,
  status text default 'available',
  max_capacity int default 15,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  start_time timestamptz not null default timezone('utc', now()),
  end_time timestamptz,
  duration_minutes int,
  status text not null default 'new',
  lead_score int default 0,
  lead_quality text default 'cold',
  budget text,
  property_type text,
  preferred_area text,
  intent text,
  assigned_agent_id uuid references public.agents(id),
  tags text[] default '{}',
  notes text,
  conversation_summary text,
  follow_up_date timestamptz,
  outcome text,
  conversion_value numeric,
  lead_score_breakdown jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null,
  message_text text not null,
  message_type text default 'text',
  timestamp timestamptz not null default timezone('utc', now()),
  is_read boolean default false,
  metadata jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.lead_tags (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tag_name text not null,
  is_auto_generated boolean default true,
  created_at timestamptz default timezone('utc', now()),
  unique (conversation_id, tag_name)
);

create table if not exists public.conversation_summaries (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  summary_text text,
  duration_minutes int,
  total_messages int,
  customer_intent text,
  preferred_area text,
  budget text,
  property_type text,
  actions_taken text[],
  missing_steps text[],
  suggested_follow_up text,
  lead_score_breakdown jsonb,
  generated_at timestamptz default timezone('utc', now()),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.follow_up_tasks (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  assigned_agent_id uuid references public.agents(id),
  priority text not null default 'high',
  follow_up_date timestamptz not null,
  reminder_type text not null default 'email',
  reminder_text text,
  status text not null default 'scheduled',
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists conversations_status_idx on public.conversations(status);
create index if not exists conversations_lead_score_idx on public.conversations(lead_score);
create index if not exists conversations_created_idx on public.conversations(created_at);
create index if not exists conversations_follow_up_idx on public.conversations(follow_up_date);
create index if not exists chat_messages_conversation_idx on public.chat_messages(conversation_id);
create index if not exists follow_up_tasks_conversation_idx on public.follow_up_tasks(conversation_id);
create index if not exists lead_tags_conversation_idx on public.lead_tags(conversation_id);

alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.conversation_summaries enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.lead_tags enable row level security;

create policy "conversations_select_admin" on public.conversations for select using (
  auth.role() = 'authenticated'
);

create policy "conversations_modify_admin" on public.conversations for all using (
  auth.uid() is not null and exists (
    select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

create policy "chat_messages_select" on public.chat_messages for select using (
  auth.uid() is not null
);

create or replace function public.fetch_conversation_analytics(date_from timestamptz default timezone('utc', now()) - interval '7 days', date_to timestamptz default timezone('utc', now()))
returns json as $$
declare
  total integer;
  hot integer;
  warm integer;
  cold integer;
  avg_duration numeric;
  avg_response numeric;
  conversion_rate numeric;
begin
  select count(*) into total from public.conversations where created_at between coalesce(date_from, created_at) and coalesce(date_to, created_at);
  select count(*) into hot from public.conversations where lead_score >= 80 and created_at between date_from and date_to;
  select count(*) into warm from public.conversations where lead_score between 50 and 79 and created_at between date_from and date_to;
  select count(*) into cold from public.conversations where lead_score < 50 and created_at between date_from and date_to;
  select avg(duration_minutes) into avg_duration from public.conversations where duration_minutes is not null;
  select avg(extract(epoch from (timestamp - lag(timestamp) over (partition by conversation_id order by timestamp)))) / 60 into avg_response
    from public.chat_messages where timestamp between date_from and date_to;
  select coalesce(sum(case when outcome = 'booking' then 1 else 0 end)::numeric / nullif(count(*),0) * 100, 0) into conversion_rate
    from public.conversations where created_at between date_from and date_to;

  return json_build_object(
    'totalConversations', coalesce(total,0),
    'hotLeads', coalesce(hot,0),
    'warmLeads', coalesce(warm,0),
    'coldLeads', coalesce(cold,0),
    'conversionRate', coalesce(conversion_rate,0),
    'averageDuration', coalesce(avg_duration,0),
    'averageResponseTime', coalesce(avg_response,0),
    'conversationVolumeTrend', (
      select json_agg(row_to_json(t)) from (
        select to_char(date_trunc('day', created_at), 'Mon DD') as date, count(*) as count
        from public.conversations
        where created_at between date_from and date_to
        group by 1 order by 1
      ) t
    ),
    'leadQualityDistribution', json_build_array(
      json_build_object('quality','hot','value',coalesce(hot,0)),
      json_build_object('quality','warm','value',coalesce(warm,0)),
      json_build_object('quality','cold','value',coalesce(cold,0))
    )
  );
end;
$$ language plpgsql security definer;

commit;
