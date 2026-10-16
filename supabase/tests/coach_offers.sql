-- Decisions 44 and 46.
select plan(9);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.coach_offers where tests.ours(id)), 1, 'the student sees only active offers');
reset role;

select tests.act_as(tests.id('coach'));
select throws_ok(
  $$insert into public.coach_offers (coach_id, tier, name, billing, price_pence, submissions_per_period)
    values (tests.id('coach'), 'premium', 'New', 'single', 100, 1)$$,
  '42501',
  'permission denied for table coach_offers',
  'a coach cannot create offers; the seed does'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.coach_offers where tests.ours(id)), 2, 'the coach sees their own inactive offer and the active one');
update public.coach_offers set name = 'Own offer' where id = tests.id('offer');
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.coach_offers where id = tests.id('offer')),
  0,
  'an unrelated coach does not see another coach''s inactive offer'
);
select is((select count(*)::int from public.coach_offers where tests.ours(id)), 1, 'an unrelated coach sees only their own offer');
update public.coach_offers set name = 'Hacked' where id = tests.id('offer');
reset role;

select tests.act_as_anon();
select is((select count(*)::int from public.coach_offers where tests.ours(id)), 1, 'anon sees the active offer');
select is(
  (select count(*)::int from public.coach_offers where id = tests.id('offer')),
  0,
  'anon does not see an inactive offer'
);
reset role;

select is(
  (select name from public.coach_offers where id = tests.id('offer')),
  'Own offer',
  'a coach updates their own offer and an unrelated coach cannot'
);
select is(
  (select name from public.coach_offers where id = tests.id('other_offer')),
  'Monthly',
  'the unrelated coach''s own offer is untouched'
);

select * from finish();
