"""Just-started Australian brands (N001-): small labels that launched in 2025 or 2026 and have few products, found
11 Nov 2026 for "very small brands ... that have just started".

How "just started" was decided (evidence for each brand is in leads/lead_database.csv, notes column):
- The store's own public product feed (Shopify): 60 products or fewer, the oldest product listed in 2025 or later.
- The site's first snapshot in the Wayback Machine is late 2024 or later, or there is none yet.
- No founding year before 2024 anywhere on the site; "founded/launched in 2025 or 2026" counts for stores that are not
  on Shopify.
- Australian (a .au domain, AUD prices or an Australian location on the site), an address published on the brand's own
  site with a working mail server (MX checked), not already in the lead database, no "no solicitation" notice.

The email is the C-batch email with one change for brands this new: the free script is one they can shoot on a
phone, since a brand that has just launched rarely has a shoot budget. Same rules otherwise: "At Mez Media, we scale
brands", no niche named in our own description, no results claimed, an opt-out line (Spam Act 2003).
Usage: python3 outreach/newbrands_au_emails.py  (prints every email; the drafts are made from TEMPLATE)
"""

TEMPLATE = """Hi {greet},

{obs} {idea}

At Mez Media, we scale brands. Want me to write it up as a 15-second script you can shoot on your phone? It's free, just reply yes.

Mueez, Mez Media: we scale brands
Instagram: @mezmedia_0
If this isn't relevant, reply "no" and I won't contact you again."""

# (id, brand, website, email, greeting, subject, observation, idea)
EMAILS = [
    ("N001", "MUSOU", "musouofficial.com", "hello@musouofficial.com", "MUSOU team", "The Yuri Brocade, made to order",
     "MUSOU makes occasion wear for weddings, the races and black-tie nights, made to order in Melbourne.",
     "An idea: the Yuri Brocade Mini Dress from fabric to fitting to race day, with 'made for you in 6 to 8 weeks' on screen."),
    ("N002", "Acci", "acciacci.com.au", "hello@acciacci.com.au", "Acci team", "Prima Volta, on camera",
     "Acci's first drop, Prima Volta, is built on ritual, memory and family.",
     "An idea: an old family photo, then the Vera Dress worn the same way today, one cut. Prima volta, the first time, in 15 seconds."),
    ("N003", "Skylan Studios", "skylanstudios.com", "hello@skylanstudios.com", "Skye", "One blazer, many ways",
     "You founded Skylan to bring modular womenswear and local craftsmanship to Western Australia's fashion scene.",
     "An idea: the Solene Blazer worn three ways in three cuts, then its pieces laid out flat. Modular is easier to show than to explain."),
    ("N004", "HUZZAH", "huzzahworld.com.au", "hello@huzzahworld.com.au", "Karla and Lauren", "Australia's newest swim label, on camera",
     "You call HUZZAH Australia's newest luxury swimwear label, cut from premium Italian fabrics.",
     "An idea: two friends in the Cat One Piece and the Scout One Piece run into the water, then the fabric up close. Friends who started a label, shown."),
    ("N005", "PLATONIKA", "platonika.com.au", "michelle@platonika.com.au", "Michelle", "The linen food cover, in use",
     "PLATONIKA's Native Green Frame & Linen Food Cover is made from honest materials, worked by hand.",
     "An idea: a summer table, a plate of fruit, the cover lowered over it and a fly bouncing off. The problem and the fix in one shot."),
    ("N006", "Other Normal", "othernormal.co", "pr@othernormal.com.au", "Other Normal team", "The Vintage Wash Hoodie, lived in",
     "Other Normal makes easy pieces like the Vintage Wash Hoodie and the Signature Pant.",
     "An idea: one person in the Vintage Wash Hoodie from morning coffee to a late night, five quick cuts, no change of clothes. Everyday is the point."),
    ("N007", "Joni Skincare", "joniskincare.com.au", "hello@joniskincare.com.au", "Joni team", "The Creamy Rice Cleanser, up close",
     "Joni is plant-based skincare made in small batches, and you're thanking people for being there at the beginning.",
     "An idea: the Creamy Rice Cleanser on a hand, the lather up close, a rinse, then Hey Rosa misted on. Texture sells skincare."),
    ("N008", "The Artist Nest", "theartistnest.com.au", "hello@theartistnest.com.au", "Mon", "27 pockets in 15 seconds",
     "You turned a personal project into The Artist Bag, 27 pockets designed in Byron Bay.",
     "An idea: a messy pile of pottery tools, then each one finding its pocket in the Artist Canvas Tool Bag, sped up. Satisfying to watch."),
    ("N009", "Freeing Venus", "freeingvenus.com", "hello@freeingvenus.com", "Freeing Venus team", "Pompom slippers on cold tiles",
     "Freeing Venus slippers are designed in Australia and handmade in Greece, after the traditional pompom tsarouchia.",
     "An idea: cold tiles, a shiver, then feet slide into the Prickly Pair slippers, pompoms bouncing. Cosy and colourful in one shot."),
    ("N010", "Romeo Waiting", "romeowaiting.com.au", "info@romeowaiting.com", "Romeo Waiting team", "The one who leaves Romeo waiting",
     "Romeo Waiting is made in Melbourne for the woman who leaves Romeo waiting.",
     "An idea: a phone buzzing with 'where are you?' while she's still getting dressed in the Jordi Jacket and Carla Mini Skirt. Your name is the story."),
    ("N011", "Anita Ov", "anitaov.com", "info@anitaov.com", "Anita", "The Wool Slip Trouser, in motion",
     "You launched your label in Melbourne in late 2025.",
     "An idea: a slow walk in the Wool Slip Trouser in Navy Stripe, the camera at hem height, then the full look. The cut is the story."),
    ("N012", "CIRQULAR", "cirqular.online", "hello@joincirqular.com", "Cheryl", "Reworked, before and after",
     "You founded CIRQULAR in 2025, after more than 12 years in buying and merchandising, to give unworn clothes a new life.",
     "An idea: a tired old blazer, then the reworked Candela Blazer on someone heading out. Before and after does the talking."),
    ("N013", "Stori of Africa", "storiofafrica.com", "hello@storiofafrica.com", "Stòrí of Africa team", "The Shea Balm, on dry skin",
     "Stòrí of Africa makes shea butter skincare, from the Shea Balm to African black soap.",
     "An idea: dry winter hands, a scoop of Shea Balm melting in, then the same hands an hour later. Show the change, not the jar."),
    ("N014", "Mooody Lemon", "mooodylemon.com", "mooodylemonceramics@gmail.com", "Grace", "The Lemon Sippy Cup, poured",
     "You hand-paint every Mooody Lemon piece in Sydney, like the Lemon Sippy Cup with its lemon straw.",
     "An idea: iced lemonade poured into the Lemon Sippy Cup, the straw going in, a sip, then the painted detail up close. Fun is the hook."),
    ("N015", "eru studios", "erustudios.com.au", "eru.studioss@gmail.com", "eru studios team", "The rest cup, slow made",
     "eru studios makes slow-made ceramics and handwoven home goods in Sydney.",
     "An idea: tea poured into the rest cup in Midnight, steam rising, a slow sip, then the glaze up close. Slow made, shown slowly."),
    ("N016", "Restful Lizards", "restfullizards.com", "restfullizards@gmail.com", "Isabella", "Clay, then jewellery",
     "Restful Lizards is your one-woman studio of polymer clay jewellery and figurines, inspired by nature and stop motion.",
     "An idea: shoot it in stop motion, a lump of clay becoming a lizard, then the earrings worn. Your inspiration becomes the ad."),
    ("N017", "Good Throw Co", "goodthrowco.com.au", "hello@goodthrowco.com.au", "Jessica", "The Alkira throw, three ways",
     "You started Good Throw Co with your family on the Gold Coast, making recycled cotton throws with First Nations and Australian artists.",
     "An idea: the Alkira Pink throw as a picnic rug, a couch throw and a bed cover, the artist's name on screen."),
    ("N018", "VAN BRUSSEL", "vanbrussel.com", "info@vanbrussel.com", "VAN BRUSSEL team", "Deadstock to blazer",
     "VAN BRUSSEL is designed and made in Australia from premium deadstock fabric: not a trend, a lifestyle.",
     "An idea: a roll of deadstock fabric, then the Alessandro Blazer walking out onto an Adelaide street. Deadstock to blazer in 15 seconds."),
    ("N019", "Elegant Ensembles", "elegants.au", "hello@elegants.au", "Elegant Ensembles team", "Corporate wear for 4'11\" to 5'2\"",
     "Elegant Ensembles makes luxury corporate wear for extra petite women, 4'11\" to 5'2\", made in Melbourne.",
     "An idea: a petite woman in a standard dress, sleeves past her hands, then the Kate Structured Petite Power Dress. The fit problem, solved."),
    ("N020", "Saigey", "saigey.com", "saige.coleman22@hotmail.com", "Saige", "Say it on a tube top",
     "Saigey's tube tops say what you love, like 'I <3 Music', and people can personalise their own.",
     "An idea: three friends, each in a tube with their own line, then 'make yours' on screen. Personalised is the hook."),
    ("N021", "Paris Jade Burrows", "parisjadeburrows.com", "pr@parisjadeburrows.com", "Paris", "The Void, page to street",
     "Your ready-to-wear collection, The Void, carries the gothic couture of your lookbook, It's Real If It Bleeds.",
     "An idea: the lookbook's pages turning, then the X-Ray Pencil Skirt and Tuxedo Bib Top on a dark street. Page to person in 15 seconds."),
    ("N022", "Monika Branagan", "monikabranagan.com", "hello@monikabranagan.com", "Monika", "The Birdie Num Num, on a grey day",
     "Since launching in 2024, you've designed colourful womenswear made to bring joy.",
     "An idea: a grey office corridor, then the Birdie Num Num Boiler Suit walking through it in full colour. Joy against grey stops the scroll."),
    ("N023", "Senchi", "senchi.au", "lmcreative.au@gmail.com", "Luke and Martie", "The Kakadu diffuser, on the drive",
     "You created Senchi when you couldn't find botanical fragrances for the car.",
     "An idea: a hot car, windows up, the Kakadu Car Reed Diffuser clipped in, then a deep breath on the drive. Make the smell visible."),
    ("N024", "Kepler Keychains", "keplerkeychains.com", "info@keplerkeychains.com", "Kepler team", "Prepared, in one shot",
     "Kepler makes legal safety keychains for Australian women, designed to be carried every day.",
     "An idea: keys in hand on a walk to the car at night, the Sunflower Beaded keychain up close, the alarm in reach. Calm and prepared, in 15 seconds."),
    ("N025", "Audrey Atelier", "audreyatelier.co", "hello@audreyatelier.co", "Audrey Atelier team", "The Luka set, three looks",
     "Audrey Atelier designs capsule pieces like the Luka Sheer Top and Skirt, alongside vintage you source.",
     "An idea: the Luka set worn for day, for dinner and over vintage, one cut each. A capsule is easier to show than explain."),
    ("N026", "OROK Fragrances", "orokfragrances.au", "hello@orokfragrances.au", "ÖRÖK team", "5AM, as a scene",
     "Each ÖRÖK fragrance tells a story, from 5AM to Rave to Shoreline.",
     "An idea: film each scent as its scene, a 5am street, a rave, a shoreline, two seconds each, then the bottle. People buy the story."),
    ("N027", "Sweet & Sweaty", "sweetandsweatyaus.com", "info@sweetandsweatyaus.com", "Alecia", "Smile Through the Pain, mid-class",
     "Sweet & Sweaty is a father-daughter team making grippy Pilates socks, and you teach Pilates yourself.",
     "An idea: a reformer class from the feet up, the 'Smile Through the Pain' socks gripping through a hard move, then a laugh. The slogan is the hook."),
    ("N028", "brood", "brood.au", "hello@brood.au", "brood team", "Knitwear from a farm shed",
     "brood comes out of your knitwear studio in a shed on a Yarra Valley farm.",
     "An idea: the knitting machine running in the shed, then the Healesville roll neck jumper on a misty Yarra Valley morning. Place and product in one cut."),
    ("N029", "Syracuse Gold Shop", "syracusegoldshop.com", "info@syracusegoldshop.com", "Syracuse team", "Gold, in your length",
     "Syracuse Gold Shop's 18-karat gold chains are handcrafted in Italy and made in custom lengths.",
     "An idea: a chain held to the neck, the length chosen, then the gold catching the light in one slow turn. Custom length is the hook."),
    ("N030", "Lost Towels", "losttowels.com", "hello@losttowels.com", "Lost Towels team", "Electric Blue, after the shower",
     "Lost Towels brings colour to bathing, with organic towels in limited edition colours like Electric Blue and Chartreuse.",
     "An idea: an all-white bathroom, then the Electric Blue Bath Towel thrown over the rail, colour flooding the frame. Colour is the product."),
    ("N031", "Aleo", "aleoshop.com.au", "info@aleoshop.com.au", "Aleo team", "Unboring decor on a boring shelf",
     "Aleo makes unboring homewares with an opinion, original designs rather than catalogue rebrands.",
     "An idea: a beige shelf, then the Green Onyx Scallop Marble Tray and Vesper Touch Lamp dropped in, and the shelf comes alive. Your line, shown."),
    ("N032", "CEZEN", "cezen.com.au", "info@cezen.com.au", "CEZEN team", "Sweet Leaf, season by season",
     "CEZEN, pronounced season, is heavy denim built around the slow fade it takes on as it's lived in.",
     "An idea: the Sweet Leaf in Raw Indigo on day one, then month three, then month nine, one cut each. The fade is the story."),
    ("N033", "Pride & Pop", "prideandpop.com", "prideandpopjewellery@gmail.com", "Pride & Pop", "Three pairs of studs for $30",
     "You make every Pride & Pop piece by hand, from the Pac-Man dangles to the flag studs.",
     "An idea: three pairs of studs picked in fast cuts, a mirror check, then 'any 3 for $30' on screen. A clear offer sells."),
    ("N034", "Sogo Ceramics", "sogoceramics.com", "sogoceramics@gmail.com", "Sogo team", "The Venus Mug, first coffee",
     "Sogo Ceramics makes mugs, plates, vases and side tables by hand in Byron Bay.",
     "An idea: the first coffee of the day poured into the Venus Mug, hands wrapped around it, the glaze up close. Handmade sells on texture."),
    ("N035", "Harlowe Parfum", "harloweparfum.com", "info@harloweparfum.com.au", "Terri", "From collecting perfume to making it",
     "You went from collecting fragrance to making it, with scents like Bondi Afternoon and Smoked Velvet.",
     "An idea: your old collection on a shelf, then a hard cut to Bondi Afternoon sprayed on a walk by the beach. Collector to maker in 15 seconds."),
    ("N036", "Cosmic Witch Society", "cosmicwitchsociety.com", "rhiannon@cosmicwitchsociety.com", "Rhiannon", "Midnight Grove, as a ritual",
     "You make Cosmic Witch Society's ritual scents as a practising witch and perfumer.",
     "An idea: candlelight, the Midnight Grove Parfum Potion opened slowly, smoke curling, then the bottle in moonlight. Ritual is the hook."),
    ("N037", "Hart + Hedi", "hartandhedi.com", "info@hartandhedi.com", "Juliette and Richard", "Four scents, four scenes",
     "You founded Hart + Hedi to capture moments in scent, using Australian native flora.",
     "An idea: a garden, a cocktail hour, a coastline and a circus, two seconds each, then the four bottles. Each scent is a scene."),
]


def render(e):
    cid, brand, site, email, greet, subject, obs, idea = e
    return subject, TEMPLATE.format(greet=greet, obs=obs, idea=idea)


if __name__ == "__main__":
    assert len({e[3] for e in EMAILS}) == len(EMAILS) and len({e[0] for e in EMAILS}) == len(EMAILS)
    for e in EMAILS:
        s, b = render(e)
        print(f"=== {e[0]} {e[1]} <{e[3]}>\nSubject: {s}\n\n{b}\n")
