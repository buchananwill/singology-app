-- Decision 51.
select plan(10);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.submissions where tests.ours(enrolment_id)), 2, 'the student sees their own submissions');
select throws_ok(
  $$delete from public.submissions where id = tests.id('submission_awaiting')$$,
  '42501',
  'permission denied for table submissions',
  'nobody signed in deletes a submission'
);
select lives_ok(
  $$insert into public.submissions (enrolment_id, library_item_id, media_id)
    values (tests.id('enrolment'), tests.id('library_item'), tests.id('student_take'))$$,
  'the student submits on their own active enrolment'
);
select throws_ok(
  $$insert into public.submissions (enrolment_id, library_item_id, media_id)
    values (tests.id('other_enrolment'), tests.id('library_item'), tests.id('student_take'))$$,
  '42501',
  'new row violates row-level security policy for table "submissions"',
  'a student cannot submit on someone else''s enrolment'
);
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.submissions
   where id in (tests.id('submission_reviewed'), tests.id('submission_awaiting'))),
  0,
  'an unrelated coach does not see the student''s submissions'
);
select is((select count(*)::int from public.submissions where tests.ours(enrolment_id)), 1, 'an unrelated coach sees only their own student''s submission');
update public.submissions set status = 'failed' where id = tests.id('submission_awaiting');
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.submissions where tests.ours(enrolment_id)), 3, 'the coach sees their student''s submissions, the new one included');
update public.submissions set status = 'reviewed' where id = tests.id('submission_awaiting');
reset role;

select is(
  (select status::text from public.submissions where id = tests.id('submission_awaiting')),
  'reviewed',
  'the coach marks their student''s submission reviewed and an unrelated coach cannot'
);

update public.enrolments set status = 'paused' where id = tests.id('enrolment');
select tests.act_as(tests.id('student'));
select throws_ok(
  $$insert into public.submissions (enrolment_id, library_item_id, media_id)
    values (tests.id('enrolment'), tests.id('library_item'), tests.id('student_take'))$$,
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
