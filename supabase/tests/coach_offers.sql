-- Decisions 44 and 46. C's offer (...0f1) is inactive; U's offer (...0f2) is active and public.
select plan(8);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.coach_offers), 1, 'the student sees only active offers');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.coach_offers), 2, 'the coach sees their own inactive offer and the active one');
update public.coach_offers set name = 'Own offer' where id = '00000000-0000-4000-8000-0000000000f1';
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.coach_offers where id = '00000000-0000-4000-8000-0000000000f1'),
  0,
  'an unrelated coach does not see another coach''s inactive offer'
);
select is((select count(*)::int from public.coach_offers), 1, 'an unrelated coach sees only their own offer');
update public.coach_offers set name = 'Hacked' where id = '00000000-0000-4000-8000-0000000000f1';
reset role;

select tests.act_as_anon();
select is((select count(*)::int from public.coach_offers), 1, 'anon sees the active offer');
select is(
  (select count(*)::int from public.coach_offers where id = '00000000-0000-4000-8000-0000000000f1'),
  0,
  'anon does not see an inactive offer'
);
reset role;

select is(
  (select name from public.coach_offers where id = '00000000-0000-4000-8000-0000000000f1'),
  'Own offer',
  'a coach updates their own offer and an unrelated coach cannot'
);
select is(
  (select name from public.coach_offers where id = '00000000-0000-4000-8000-0000000000f2'),
  'Monthly',
  'the unrelated coach''s own offer is untouched'
);

select * from finish();
