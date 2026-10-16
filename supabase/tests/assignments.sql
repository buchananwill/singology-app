-- Decision 53. Assignment ...301 is on S-C; ...302 is on S2-U.
select plan(8);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.assignments), 1, 'the student sees their own assignment');
select throws_ok(
  $$insert into public.assignments (enrolment_id, library_item_id)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1')$$,
  '42501',
  'new row violates row-level security policy for table "assignments"',
  'a student cannot assign themselves an exercise'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.assignments where id = '00000000-0000-4000-8000-000000000301'),
  0,
  'an unrelated coach does not see the assignment'
);
select is((select count(*)::int from public.assignments), 1, 'an unrelated coach sees only their own student''s assignment');
select throws_ok(
  $$insert into public.assignments (enrolment_id, library_item_id)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1')$$,
  '42501',
  'new row violates row-level security policy for table "assignments"',
  'an unrelated coach cannot assign to another coach''s student'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.assignments), 1, 'the coach sees their student''s assignment');
select lives_ok(
  $$insert into public.assignments (enrolment_id, library_item_id)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1')$$,
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
