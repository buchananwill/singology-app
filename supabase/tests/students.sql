-- Decision 47. S (...0a1) is enrolled with C (...0c1); S2 (...0a2) with U (...0c2).
select plan(7);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.students), 1, 'the student sees only their own row');
update public.students set voice_type = 'alto' where user_id = '00000000-0000-4000-8000-0000000000a1';
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.students), 1, 'the coach sees their enrolled student');
select is(
  (select count(*)::int from public.students where user_id = '00000000-0000-4000-8000-0000000000a1'),
  1,
  'the coach''s visible student is S'
);
update public.students set voice_type = 'bass' where user_id = '00000000-0000-4000-8000-0000000000a1';
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.students where user_id = '00000000-0000-4000-8000-0000000000a1'),
  0,
  'an unrelated coach does not see the student'
);
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.students',
  '42501',
  'permission denied for table students',
  'anon cannot read students'
);
reset role;

select is(
  (select voice_type::text from public.students where user_id = '00000000-0000-4000-8000-0000000000a1'),
  'alto',
  'the student updates their own row and their coach cannot'
);
select is(
  (select voice_type::text from public.students where user_id = '00000000-0000-4000-8000-0000000000a2'),
  'bass',
  'no other student row changed'
);

select * from finish();
