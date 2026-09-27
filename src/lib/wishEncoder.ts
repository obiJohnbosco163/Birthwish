import { Birthwish } from '../types';

/**
 * Universal Shareable Link Utilities for Birthwish
 * 
 * Generates an immutable, cross-device viewing link:
 * 1. Supports clean hash-based links: `https://.../#wish-<id>`
 * 2. Also bundles self-contained compressed JSON payload in the link (`#tribute=<data>`)
 *    so even if opened on an incognito window, mobile device, or separate computer
 *    where the creator's local storage isn't present, the celebrant link decodes
 *    and launches the entire celebration journey from beginning to end!
 */

export const generateShareableWishLink = (wish: Birthwish): string => {
  if (typeof window === 'undefined') return '';
  const base = `${window.location.origin}${window.location.pathname.replace(/\/+$/, '')}`;
  
  try {
    // Pack essential fields for a foolproof cross-device preview
    const payload = {
      id: wish.id,
      ca: wish.createdAt,
      u: wish.userId,
      c: wish.category,
      cc: wish.customCategory,
      t: wish.colorTheme,
      cn: wish.celebrantName,
      nn: wish.celebrantNickname,
      g: wish.celebrantGender,
      ci: wish.coverImage,
      mi: wish.mainImage,
      sm: wish.shortMessage,
      fe: wish.finalEpistle,
      sr: wish.senderRelation,
      sn: wish.senderName,
      hg: wish.hasGift,
      ga: wish.giftAmount,
      gc: wish.giftCurrency,
      gp: wish.giftPasscode,
      gs: wish.giftStatus,
      kr: wish.koraPaymentReference,
    };

    const json = JSON.stringify(payload);
    // Safe base64 encoding for unicode
    const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
    
    // Primary viewing link with fallback wish ID for maximum compatibility
    return `${base}/#view=${wish.id}&data=${encodeURIComponent(b64)}`;
  } catch (err) {
    console.warn('Fallback to standard hash link:', err);
    return `${base}/#wish-${wish.id}`;
  }
};

export const decodeShareableWish = (hash: string): { wishId: string | null; encodedWish: Birthwish | null } => {
  if (!hash) return { wishId: null, encodedWish: null };

  const cleanHash = hash.replace(/^#/, '');

  // Case 1: Simple hash `#wish-123`
  if (cleanHash.startsWith('wish-')) {
    const id = cleanHash.replace('wish-', '');
    return { wishId: id, encodedWish: null };
  }

  // Case 2: View query format `#view=<id>&data=<b64>`
  try {
    const params = new URLSearchParams(cleanHash);
    const wishId = params.get('view') || params.get('wish');
    const data = params.get('data');

    if (data) {
      const decodedJson = decodeURIComponent(
        Array.prototype.map.call(atob(decodeURIComponent(data)), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      const p = JSON.parse(decodedJson);
      
      const wish: Birthwish = {
        id: p.id || wishId || `wish-${Date.now()}`,
        createdAt: p.ca || new Date().toISOString(),
        userId: p.u || 'creator',
        category: p.c || 'Others',
        customCategory: p.cc,
        colorTheme: p.t || 'pink',
        celebrantName: p.cn || 'Celebrant',
        celebrantNickname: p.nn,
        celebrantGender: p.g || 'others',
        coverImage: p.ci,
        mainImage: p.mi,
        shortMessage: p.sm || 'Happy Birthday!',
        finalEpistle: p.fe || 'Wishing you the happiest birthday filled with joy and blessings!',
        senderRelation: p.sr || 'Friend',
        senderName: p.sn || 'Someone Special',
        hasGift: Boolean(p.hg),
        giftAmount: p.ga,
        giftCurrency: p.gc || 'NGN',
        giftPasscode: p.gp,
        giftStatus: p.gs || 'unfunded',
        koraPaymentReference: p.kr,
      };

      return { wishId: wish.id, encodedWish: wish };
    }

    if (wishId) {
      return { wishId, encodedWish: null };
    }
  } catch (err) {
    console.warn('Could not decode wish payload from hash:', err);
  }

  return { wishId: null, encodedWish: null };
};
