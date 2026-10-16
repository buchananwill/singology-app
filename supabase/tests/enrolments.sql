-- Decision 48.
select plan(6);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.enrolments where tests.ours(id)), 1, 'the student sees their own enrolment');
select throws_ok(
  $$insert into public.enrolments (student_id, coach_id, offer_id) values
    (tests.id('student'), tests.id('other_coach'), tests.id('other_offer'))$$,
  '42501',
  'permission denied for table enrolments',
  'a student cannot enrol themselves'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.enrolments where tests.ours(id)), 1, 'the coach sees their own enrolment');
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.enrolments where id = tests.id('enrolment')),
  0,
  'an unrelated coach does not see the enrolment'
);
select is((select count(*)::int from public.enrolments where tests.ours(id)), 1, 'an unrelated coach sees only their own enrolment');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.enrolments',
  '42501',
  'permission denied for table enrolments',
  'anon cannot read enrolments'
);
reset role;

select * from finish();
