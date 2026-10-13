-- Seed canonical merchants and aliases.
-- Recognising a merchant does NOT imply the transaction is a subscription.

DO $$
DECLARE
  merchant_count INT;
BEGIN
  SELECT COUNT(*) INTO merchant_count FROM merchants;
  IF merchant_count = 0 THEN

    -- Streaming & Entertainment
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('streaming', 'Netflix', 'https://www.netflix.com', 'NG', 'Global video streaming'),
      ('streaming', 'Spotify', 'https://www.spotify.com', 'NG', 'Music streaming'),
      ('streaming', 'YouTube Premium', 'https://premium.youtube.com', 'NG', 'Ad-free YouTube'),
      ('streaming', 'Showmax', 'https://www.showmax.com', 'NG', 'African video streaming'),
      ('streaming', 'Amazon Prime Video', 'https://www.amazon.com/primevideo', 'NG', 'Video streaming'),
      ('streaming', 'Apple TV+', 'https://tv.apple.com', 'NG', 'Apple video streaming'),
      ('streaming', 'Disney+', 'https://www.disneyplus.com', 'NG', 'Disney video streaming'),
      ('streaming', 'HBO Max', 'https://www.max.com', 'NG', 'HBO content streaming'),
      ('streaming', 'Hulu', 'https://www.hulu.com', 'US', 'US video streaming')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('music', 'Apple Music', 'https://music.apple.com', 'NG', 'Music streaming'),
      ('music', 'Audible', 'https://www.audible.com', 'NG', 'Audio books'),
      ('music', 'Deezer', 'https://www.deezer.com', 'NG', 'Music streaming')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('gaming', 'Xbox Game Pass', 'https://www.xbox.com/en-us/ultimate', 'NG', 'Gaming subscription'),
      ('gaming', 'PlayStation Plus', 'https://www.playstation.com/en-us/psplus', 'NG', 'PlayStation subscription'),
      ('gaming', 'Nintendo Switch Online', 'https://www.nintendo.com/switch-online', 'NG', 'Nintendo subscription'),
      ('gaming', 'Steam', 'https://store.steampowered.com', 'NG', 'PC gaming store'),
      ('gaming', 'Epic Games', 'https://www.epicgames.com', 'NG', 'Game store'),
      ('gaming', 'Roblox', 'https://www.roblox.com', 'NG', 'Game platform')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Software & SaaS
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('software', 'Microsoft 365', 'https://www.microsoft.com/microsoft-365', 'NG', 'Office subscription'),
      ('software', 'Adobe', 'https://www.adobe.com', 'NG', 'Creative Cloud'),
      ('software', 'Canva', 'https://www.canva.com', 'NG', 'Design tool'),
      ('software', 'Figma', 'https://www.figma.com', 'NG', 'Design collaboration'),
      ('software', 'Notion', 'https://www.notion.so', 'NG', 'Productivity'),
      ('software', 'Slack', 'https://slack.com', 'NG', 'Team messaging'),
      ('software', 'Zoom', 'https://zoom.us', 'NG', 'Video meetings'),
      ('software', 'GitHub', 'https://github.com', 'NG', 'Developer platform'),
      ('software', 'JetBrains', 'https://www.jetbrains.com', 'NG', 'Developer tools'),
      ('software', 'Dropbox', 'https://www.dropbox.com', 'NG', 'Cloud storage'),
      ('software', 'Linear', 'https://linear.app', 'NG', 'Project tracking'),
      ('software', 'Google Workspace', 'https://workspace.google.com', 'NG', 'Business tools')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Cloud Hosting & Infrastructure
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('cloud', 'Amazon Web Services', 'https://aws.amazon.com', 'NG', 'Cloud computing'),
      ('cloud', 'Microsoft Azure', 'https://azure.microsoft.com', 'NG', 'Cloud platform'),
      ('cloud', 'Google Cloud', 'https://cloud.google.com', 'NG', 'Cloud platform'),
      ('cloud', 'DigitalOcean', 'https://www.digitalocean.com', 'NG', 'Cloud hosting'),
      ('cloud', 'Vultr', 'https://www.vultr.com', 'NG', 'Cloud hosting'),
      ('cloud', 'Heroku', 'https://www.heroku.com', 'NG', 'Application hosting'),
      ('cloud', 'Linode', 'https://www.linode.com', 'NG', 'Cloud hosting'),
      ('cloud', 'Cloudflare', 'https://www.cloudflare.com', 'NG', 'CDN and security')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Telecommunications & Data
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('telecom', 'MTN', 'https://www.mtn.ng', 'NG', 'Nigerian telecom'),
      ('telecom', 'Airtel', 'https://www.airtel.ng', 'NG', 'Nigerian telecom'),
      ('telecom', 'Glo', 'https://www.gloworld.com/ng', 'NG', 'Nigerian telecom'),
      ('telecom', '9mobile', 'https://www.9mobile.ng', 'NG', 'Nigerian telecom'),
      ('telecom', 'Starlink', 'https://www.starlink.com', 'NG', 'Satellite internet'),
      ('telecom', 'Verizon', 'https://www.verizon.com', 'US', 'US telecom'),
      ('telecom', 'AT&T', 'https://www.att.com', 'US', 'US telecom'),
      ('telecom', 'T-Mobile', 'https://www.t-mobile.com', 'US', 'US telecom'),
      ('telecom', 'Vodacom', 'https://www.vodacom.co.za', 'ZA', 'South African telecom'),
      ('telecom', 'Singtel', 'https://www.singtel.com', 'SG', 'Singapore telecom')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Utilities
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('utilities', 'IKEA Electric', 'https://www.ikejaelectric.com', 'NG', 'Lagos electricity'),
      ('utilities', 'Eko Electricity', 'https://www.ekebill.ng', 'NG', 'Lagos electricity'),
      ('utilities', 'Jos Electricity', 'https://www.jesgonline.com', 'NG', 'Plateau electricity'),
      ('utilities', 'Ibadan Electricity', 'https://www.ibieled.net', 'NG', 'Oyo electricity'),
      ('utilities', 'Port Harcourt Electricity', 'https://www.power-dot-ng.com', 'NG', 'PH electricity'),
      ('utilities', 'Water Board', 'https://www.waterboard.ng', 'NG', 'Water utility'),
      ('utilities', 'Cooking Gas', 'https://www.nggas.com', 'NG', 'LPG supply'),
      ('utilities', 'Diesel Supply', 'https://www.diesel.ng', 'NG', 'Generator fuel')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Insurance
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('insurance', 'Insurance Premium', 'https://www.insurance.com', 'NG', 'Generic insurance'),
      ('insurance', 'Life Insurance', 'https://www.lifeinsurance.com', 'NG', 'Life cover'),
      ('insurance', 'Health Insurance', 'https://www.healthinsurance.com', 'NG', 'Medical cover'),
      ('insurance', 'Car Insurance', 'https://www.carinsurence.com', 'NG', 'Vehicle cover'),
      ('insurance', 'Allstate', 'https://www.allstate.com', 'US', 'US insurance'),
      ('insurance', 'Progressive', 'https://www.progressive.com', 'US', 'US insurance'),
      ('insurance', 'State Farm', 'https://www.statefarm.com', 'US', 'US insurance'),
      ('insurance', 'Geico', 'https://www.geico.com', 'US', 'US insurance')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Banking & Financial Services
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('banking', 'Paystack', 'https://paystack.com', 'NG', 'Fintech'),
      ('banking', 'Flutterwave', 'https://flutterwave.com', 'NG', 'Fintech'),
      ('banking', 'Monnify', 'https://monnify.com', 'NG', 'Fintech'),
      ('banking', 'PayPal', 'https://www.paypal.com', 'NG', 'Global payments'),
      ('banking', 'Wise', 'https://wise.com', 'NG', 'Currency transfer'),
      ('banking', 'Bank Transfer Fee', 'https://www.bank.com', 'NG', 'Bank fee'),
      ('banking', 'Card Maintenance Fee', 'https://www.bank.com', 'NG', 'Bank fee'),
      ('banking', 'Interest Charge', 'https://www.bank.com', 'NG', 'Interest charge'),
      ('banking', 'Loan Repayment', 'https://www.bank.com', 'NG', 'Loan'),
      ('banking', 'Mutual Fund', 'https://www.mutualfund.com', 'NG', 'Investment')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Education
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('education', 'Coursera', 'https://www.coursera.org', 'NG', 'Online courses'),
      ('education', 'Udemy', 'https://www.udemy.com', 'NG', 'Online courses'),
      ('education', 'Udacity', 'https://www.udacity.com', 'NG', 'Online courses'),
      ('education', 'Skillshare', 'https://www.skillshare.com', 'NG', 'Creative courses'),
      ('education', 'LinkedIn Learning', 'https://www.linkedin.com/learning', 'NG', 'Professional courses'),
      ('education', 'Pluralsight', 'https://www.pluralsight.com', 'NG', 'Developer courses'),
      ('education', 'edX', 'https://www.edx.org', 'NG', 'University courses')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Fitness & Wellness
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('fitness', 'Gym Membership', 'https://www.gym.com', 'NG', 'Gym'),
      ('fitness', 'Fitness Club', 'https://www.fitnessclub.com', 'NG', 'Fitness club'),
      ('fitness', 'Peloton', 'https://www.onepeloton.com', 'NG', 'Fitness subscription'),
      ('fitness', 'Planet Fitness', 'https://www.planetfitness.com', 'US', 'Gym chain'),
      ('fitness', '24 Hour Fitness', 'https://www.24hourfitness.com', 'US', 'Gym chain'),
      ('fitness', 'Anytime Fitness', 'https://www.anytimefitness.com', 'US', 'Gym chain'),
      ('fitness', 'Health Club', 'https://www.healthclub.com', 'NG', 'Health club')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Shopping & Memberships
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('shopping', 'Amazon', 'https://www.amazon.com', 'NG', 'E-commerce'),
      ('shopping', 'eBay', 'https://www.ebay.com', 'NG', 'E-commerce'),
      ('shopping', 'Walmart', 'https://www.walmart.com', 'NG', 'Retail'),
      ('shopping', 'Target', 'https://www.target.com', 'NG', 'Retail'),
      ('shopping', 'Etsy', 'https://www.etsy.com', 'NG', 'Handmade marketplace'),
      ('shopping', 'Membership Club', 'https://www.club.com', 'NG', 'Membership'),
      ('shopping', 'Subscription Box', 'https://www.box.com', 'NG', 'Subscription box')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Transport & Mobility
    INSERT INTO merchants (category_id, canonical_name, website, country, notes)
    VALUES
      ('transport', 'Uber', 'https://www.uber.com', 'NG', 'Ride-hailing'),
      ('transport', 'Lyft', 'https://www.lyft.com', 'US', 'Ride-hailing'),
      ('transport', 'Grab', 'https://www.grab.com', 'SG', 'Ride-hailing'),
      ('transport', 'Airbnb', 'https://www.airbnb.com', 'NG', 'Accommodation'),
      ('transport', 'Booking.com', 'https://www.booking.com', 'NG', 'Travel bookings'),
      ('transport', 'Expedia', 'https://www.expedia.com', 'NG', 'Travel bookings')
    ON CONFLICT (category_id, LOWER(canonical_name)) DO NOTHING;

    -- Aliases for recognition (exact first, then token aliases)
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Netflix', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'netflix'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'netflix subscription', 'token' FROM merchants WHERE LOWER(canonical_name) = 'netflix'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'netflix.com', 'token' FROM merchants WHERE LOWER(canonical_name) = 'netflix'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Spotify', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'spotify'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'spotify premium', 'token' FROM merchants WHERE LOWER(canonical_name) = 'spotify'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'YouTube Premium', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'youtube premium'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'YouTube', 'token' FROM merchants WHERE LOWER(canonical_name) = 'youtube premium'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Showmax', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'showmax'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Apple TV+', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'apple tv+'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Apple Music', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'apple music'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Disney+', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'disney+'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'HBO Max', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'hbo max'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Hulu', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'hulu'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Amazon Prime Video', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'amazon prime video'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Microsoft 365', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'microsoft 365'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Office 365', 'token' FROM merchants WHERE LOWER(canonical_name) = 'microsoft 365'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Adobe', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'adobe'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Canva', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'canva'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Figma', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'figma'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Notion', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'notion'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Slack', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'slack'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Zoom', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'zoom'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'GitHub', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'github'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Dropbox', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'dropbox'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'AWS', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'amazon web services'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Azure', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'microsoft azure'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Google Cloud', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'google cloud'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'MTN', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'mtn'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Airtel', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'airtel'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Glo', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'glo'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, '9mobile', 'exact' FROM merchants WHERE LOWER(canonical_name) = '9mobile'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Starlink', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'starlink'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Paystack', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'paystack'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Flutterwave', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'flutterwave'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Monnify', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'monnify'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'PayPal', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'paypal'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Coursera', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'coursera'
    ON CONFLICT DO NOTHING;
    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Udemy', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'udemy'
    ON CONFLICT DO NOTHING;

    INSERT INTO merchant_aliases (merchant_id, alias, match_type)
    SELECT id, 'Uber', 'exact' FROM merchants WHERE LOWER(canonical_name) = 'uber'
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Merchant seed completed';
  ELSE
    RAISE NOTICE 'Merchant seed skipped: merchants=%', merchant_count;
  END IF;
END $$;
