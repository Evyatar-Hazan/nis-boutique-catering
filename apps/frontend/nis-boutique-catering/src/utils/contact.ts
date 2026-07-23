import {
  buildInquiryWhatsappLink as buildSharedInquiryWhatsappLink,
  buildWhatsappLink as buildSharedWhatsappLink,
} from '@monorepo/site-preview';
import { whatsappBase } from '../data/siteContent';

export const buildWhatsappLink = (message: string): string =>
  buildSharedWhatsappLink(whatsappBase, message);

export const buildInquiryWhatsappLink = (topic: string): string =>
  buildSharedInquiryWhatsappLink(whatsappBase, topic);
