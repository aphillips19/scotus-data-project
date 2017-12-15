We are using two versions of the SCDB: justice-centered and case-centered. The former has
around 100,000 lines of data, 1 for each justice's vote in each case, and the latter around
10,000 lines of data, 1 for each case. The justice-centered dataset includes all of the 
information in the case-centered dataset, in addition to information about each justice's
votes.

Data - stuff goes here

This information is taken from the codebook
available at: http://scdb.wustl.edu/_brickFiles/2017_01/SCDB_2017_01_codebook.pdf


Professor Sorenson has added the following useful columns to the Supreme Court databases, 


In the justice-centered database:
  - term: The term (year) in which this case was decided. May consider using
    this rather than dateDecision for the year. This differs from the year in
    dateDecision in many cases, presumably because the court terms do not line
    up exactly with calendar years

  - term:       The term of the court, as a year. This differs in many cases
                from the year in dateDecision
  - medianJJ:   The name of the median (or swing-vote) justice
  - liberal:    1 if the justice is liberal, 0 if not)
  - median:     1 if the justice is the median, 0 if not
  - lib_median: 1 when the court is liberal and the justice is liberal (when
                the justice is the swing vote)
  - lib_court:  1 if the court is liberal, 0 if not

  NOTE: medianJJ and lib_court are all the same for a given term, while the
        other variables differ for each case, for each justice.

In the case-centered database:
  - term:       see above
  - medianJJ:   see above
  - lib_median: see above
  - lib_court:  see above

  