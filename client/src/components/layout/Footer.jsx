import { CircleHelp, Facebook, Instagram, Mail, Store, Youtube } from "lucide-react";

const footerSections = [
  {
    title: "ABOUT",
    items: ["Contact Us", "About Us", "Careers", "Flipkart Stories", "Press", "Corporate Information"]
  },
  {
    title: "GROUP COMPANIES",
    items: ["Myntra", "Cleartrip", "Shopsy"]
  },
  {
    title: "HELP",
    items: ["Payments", "Shipping", "Cancellation & Returns", "FAQ"]
  },
  {
    title: "CONSUMER POLICY",
    items: ["Cancellation & Returns", "Terms Of Use", "Security", "Privacy", "Sitemap", "Grievance Redressal", "EPR Compliance", "FSSAI Food Safety Connect App"]
  }
];

const Footer = () => {
  return (
    <footer className="mt-8 bg-[#172337] text-white">
      <div className="container-main py-10">
        <div className="grid gap-8 border-b border-[#3e4a5b] pb-10 lg:grid-cols-[repeat(4,minmax(0,1fr))_1.2fr_1.2fr]">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-xs uppercase tracking-wide text-[#878787]">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item} className="text-[15px] font-medium leading-5 text-white">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="border-l border-[#3e4a5b] pl-8">
            <h3 className="mb-3 text-xs text-[#878787]">Mail Us:</h3>
            <p className="text-[15px] leading-7 text-white">
              Flipkart Internet Private Limited,
              <br />
              Buildings Alyssa, Begonia &
              <br />
              Clove Embassy Tech Village,
              <br />
              Outer Ring Road, Devarabeesanahalli Village,
              <br />
              Bengaluru, 560103,
              <br />
              Karnataka, India
            </p>
            <p className="mt-5 text-[13px] text-[#878787]">Social:</p>
            <div className="mt-3 flex items-center gap-5 text-white">
              <Facebook className="h-5 w-5" />
              <span className="text-2xl leading-none">X</span>
              <Youtube className="h-5 w-5" />
              <Instagram className="h-5 w-5" />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs text-[#878787]">Registered Office Address:</h3>
            <p className="text-[15px] leading-7 text-white">
              Flipkart Internet Private Limited,
              <br />
              Buildings Alyssa, Begonia &
              <br />
              Clove Embassy Tech Village,
              <br />
              Outer Ring Road, Devarabeesanahalli Village,
              <br />
              Bengaluru, 560103,
              <br />
              Karnataka, India
              <br />
              CIN : U51109KA2012PTC066107
              <br />
              Telephone: <span className="text-[#2874f0]">044-45614700 / 044-67415800</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-8 text-[15px]">
          <div className="flex flex-wrap items-center gap-8 text-white">
            <span className="inline-flex items-center gap-2">
              <Store className="h-4 w-4 text-[#ffe500]" />
              Become a Seller
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#ffe500]" />
              Advertise
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-[#ffe500]">+</span>
              Gift Cards
            </span>
            <span className="inline-flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-[#ffe500]" />
              Help Center
            </span>
          </div>

          <p className="text-white">(c) 2007-2026 Flipkart.com</p>

          <div className="flex items-center gap-1">
            <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-[#172337]">VISA</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-[#172337]">MC</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-[#172337]">AMEX</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-[#172337]">DISC</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-[#172337]">UPI</span>
            <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-[#172337]">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
