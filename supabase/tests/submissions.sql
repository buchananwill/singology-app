-- Decision 51. Submissions ...401 and ...403 are S's (enrolled with C); ...402 is S2's (with U).
select plan(9);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.submissions), 2, 'the student sees their own submissions');
select lives_ok(
  $$insert into public.submissions (enrolment_id, library_item_id, media_id)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a0')$$,
  'the student submits on their own active enrolment'
);
select throws_ok(
  $$insert into public.submissions (enrolment_id, library_item_id, media_id)
    values ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a0')$$,
  '42501',
  'new row violates row-level security policy for table "submissions"',
  'a student cannot submit on someone else''s enrolment'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.submissions
   where id in ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000403')),
  0,
  'an unrelated coach does not see the student''s submissions'
);
select is((select count(*)::int from public.submissions), 1, 'an unrelated coach sees only their own student''s submission');
update public.submissions set status = 'failed' where id = '00000000-0000-4000-8000-000000000403';
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.submissions), 3, 'the coach sees their student''s submissions, the new one included');
update public.submissions set status = 'reviewed' where id = '00000000-0000-4000-8000-000000000403';
reset role;

select is(
  (select status::text from public.submissions where id = '00000000-0000-4000-8000-000000000403'),
  'reviewed',
  'the coach marks their student''s submission reviewed and an unrelated coach cannot'
);

update public.enrolments set status = 'paused' where id = '00000000-0000-4000-8000-0000000000e1';
select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select throws_ok(
  $$insert into public.submissions (enrolment_id, library_item_id, media_id)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a0')$$,
  '42501',
  'new row violates row-level security policy for table "submissions"',
  'a student cannot submit on an enrolment that is not active'
);
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.submissions',
  '42501',
  'permission denied for table submissions',
  'anon cannot read submissions'
);
reset role;

select * from finish();
