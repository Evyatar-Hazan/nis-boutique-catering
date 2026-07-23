const businessPhoneNational = '0559945928' as const;

const toIsraeliE164 = (phone: string): `+972${string}` => {
  if (!/^05\d{8}$/u.test(phone)) {
    throw new Error('Business phone must be a 10-digit Israeli mobile number.');
  }

  return `+972${phone.slice(1)}`;
};

const phoneE164 = toIsraeliE164(businessPhoneNational);

export const businessContact = Object.freeze({
  phoneNational: businessPhoneNational,
  phoneDisplay: `${businessPhoneNational.slice(0, 3)}-${businessPhoneNational.slice(3)}`,
  phoneE164,
  phoneHref: `tel:${phoneE164}`,
  whatsappBase: `https://wa.me/${phoneE164.slice(1)}`,
});
