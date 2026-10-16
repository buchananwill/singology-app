-- Decision 53.
select plan(9);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.assignments where tests.ours(enrolment_id)), 1, 'the student sees their own assignment');
select throws_ok(
  $$update public.assignments set library_item_id = tests.id('library_item') where id = tests.id('assignment')$$,
  '42501',
  'permission denied for table assignments',
  'nobody signed in changes an assignment'
);
select throws_ok(
  $$insert into public.assignments (enrolment_id, library_item_id)
    values (tests.id('enrolment'), tests.id('library_item'))$$,
  '42501',
  'new row violates row-level security policy for table "assignments"',
  'a student cannot assign themselves an exercise'
);
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.assignments where id = tests.id('assignment')),
  0,
  'an unrelated coach does not see the assignment'
);
select is((select count(*)::int from public.assignments where tests.ours(enrolment_id)), 1, 'an unrelated coach sees only their own student''s assignment');
select throws_ok(
  $$insert into public.assignments (enrolment_id, library_item_id)
    values (tests.id('enrolment'), tests.id('library_item'))$$,
  '42501',
  'new row violates row-level security policy for table "assignments"',
  'an unrelated coach cannot assign to another coach''s student'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.assignments where tests.ours(enrolment_id)), 1, 'the coach sees their student''s assignment');
select lives_ok(
  $$insert into public.assignments (enrolment_id, library_item_id)
    values (tests.id('enrolment'), tests.id('library_item'))$$,
  'the coach assigns an exercise to their own student'
);
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.assignments',
  '42501',
  'permission denied for table assignments',
  'anon cannot read assignments'
);
reset role;

select * from finish();
