LOAD DATA LOCAL INFILE '4letter6hop.csv' 
INTO TABLE pair4
FIELDS TERMINATED BY ',' 
optionally enclosed BY '"'
LINES TERMINATED BY '\n'
(@col1,@col2) set pair=@col1, fullpath=trim(both '"' from (trim(leading ' ' from @col2))), minpathlength = 6
;

delete from pair4 where pair = 'pair';

update pair4 p_longer
set keep = 1
where not exists(
  select 1
  from pair4 p_shorter
  where p_longer.pair = p_shorter.pair
  and p_longer.minpathlength > p_shorter.minpathlength
  and p_shorter.keep = 1
)
and p_longer.minpathlength = 6
;

select pair, fullpath, minpathlength
INTO OUTFILE '/var/lib/mysql/4_toload.csv'
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
from pair4
where keep = 1
and minpathlength > 1
order by minpathlength, pair, fullpath
;

select distinct pair, minpathlength
INTO OUTFILE '/var/lib/mysql/4_pairs.csv'
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
from pair4
where keep = 1
order by pair
;


set @rn = 0;
LOAD DATA LOCAL INFILE 'pairs_4_6.txt' 
INTO TABLE allpairs
FIELDS TERMINATED BY ',' 
optionally enclosed BY '"'
LINES TERMINATED BY '\n'
(pair) set letters_hops=46, pairoffset= (@rn := @rn + 1)
;
