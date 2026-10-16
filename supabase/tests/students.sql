-- Decision 47.
select plan(8);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.students where tests.ours(user_id)), 1, 'the student sees only their own row');
update public.students set voice_type = 'alto' where user_id = tests.id('student');
select throws_ok(
  $$delete from public.students where user_id = tests.id('student')$$,
  '42501',
  'permission denied for table students',
  'nobody signed in deletes a student'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.students where tests.ours(user_id)), 1, 'the coach sees their enrolled student');
select is(
  (select count(*)::int from public.students where user_id = tests.id('student')),
  1,
  'the coach''s visible student is their own'
);
update public.students set voice_type = 'bass' where user_id = tests.id('student');
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.students where user_id = tests.id('student')),
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
  (select voice_type::text from public.students where user_id = tests.id('student')),
  'alto',
  'the student updates their own row and their coach cannot'
);
select is(
  (select voice_type::text from public.students where user_id = tests.id('other_student')),
  'bass',
  'no other student row changed'
);

select * from finish();
