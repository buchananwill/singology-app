-- Decision 48. Enrolment ...0e1 is S with C; ...0e2 is S2 with U.
select plan(6);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.enrolments), 1, 'the student sees their own enrolment');
select throws_ok(
  $$insert into public.enrolments (student_id, coach_id, offer_id) values
    ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000f2')$$,
  '42501',
  'new row violates row-level security policy for table "enrolments"',
  'a student cannot enrol themselves'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.enrolments), 1, 'the coach sees their own enrolment');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.enrolments where id = '00000000-0000-4000-8000-0000000000e1'),
  0,
  'an unrelated coach does not see the enrolment'
);
select is((select count(*)::int from public.enrolments), 1, 'an unrelated coach sees only their own enrolment');
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
