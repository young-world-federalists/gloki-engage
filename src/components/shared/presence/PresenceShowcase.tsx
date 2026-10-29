import React from 'react';
import Card from '../Card';
import CountryFlag from '../CountryFlag';
import { ShowInMyLanguage } from '../AITools';
import LanguageBar from './LanguageBar';
import ParticipationSummary from './ParticipationSummary';
import WorldMapLite from './WorldMapLite';
import { DataSaverToggle, SmartImage, SyncBadge, ChannelBadge } from '../connectivity';
import { useT } from '../../../i18n';
import { getCountryColor } from '../../../utils/countries';
import {
  VFTC_LANGUAGES,
  VFTC_PARTICIPATION,
  PRESENCE_POSTS,
  type ChannelKind,
  type SyncStatus,
} from '../../../services/demo/fixtures/presence';
import styles from './PresenceShowcase.module.scss';

// Self-contained avatar (offline-safe SVG data URI) so SmartImage's data-saver
// behaviour is visible without any network: a colour-coded circle when images
// load, vs. SmartImage's own initials placeholder when data-saver is on.
function avatarFor(name: string, country: string): string {
  const color = getCountryColor(country);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
    `<rect width='80' height='80' rx='40' fill='${color}'/>` +
    `<text x='40' y='52' font-size='36' fill='white' text-anchor='middle' font-family='sans-serif'>${initial}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const ALL_CHANNELS: ChannelKind[] = ['app', 'whatsapp', 'sms', 'ussd'];
const ALL_SYNC: SyncStatus[] = ['synced', 'pending', 'offline'];

/**
 * Verification gallery for the Lane F cross-cutting components. Not part of the
 * product surface — mounted at a dev route so the presence/connectivity/
 * translation primitives can be exercised together (and reviewed) in one place.
 */
const PresenceShowcase: React.FC = () => {
  const t = useT();
  const fmtTime = (m: number) =>
    m < 60
      ? t('presence.minutesAgo', '{n}m ago', { n: m })
      : t('presence.hoursAgo', '{n}h ago', { n: Math.floor(m / 60) });

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>{t('presence.showcaseTitle', 'Presence & connectivity')}</h1>
        <p className={styles.subtitle}>
          {t('presence.showcaseSubtitle', 'Across borders, across languages, on any connection.')}
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('presence.sectionLanguage', 'Language')}</h2>
        <Card>
          <LanguageBar languages={VFTC_LANGUAGES} />
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('presence.sectionPresence', 'Who’s here')}</h2>
        <Card>
          <ParticipationSummary participation={VFTC_PARTICIPATION} />
          <div className={styles.spacer} />
          <WorldMapLite participation={VFTC_PARTICIPATION} />
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {t('presence.sectionPosts', 'Live translation & bridges')}
        </h2>
        <div className={styles.posts}>
          {PRESENCE_POSTS.map((post) => (
            <Card key={post.id} as="article" className={styles.post}>
              <div className={styles.postHead}>
                <SmartImage
                  src={avatarFor(post.author, post.country)}
                  alt={post.author}
                  fallbackLabel={post.author}
                  size={40}
                  rounded
                />
                <div className={styles.postMeta}>
                  <span className={styles.author}>
                    {post.author} <CountryFlag code={post.country} size="sm" />
                  </span>
                  <span className={styles.time}>{fmtTime(post.minutesAgo)}</span>
                </div>
                <div className={styles.postTags}>
                  <ChannelBadge channel={post.channel} />
                  {post.sync && <SyncBadge status={post.sync} />}
                </div>
              </div>
              <ShowInMyLanguage body={post.body} sourceLang={post.language} />
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {t('presence.sectionConnectivity', 'Low-bandwidth & offline')}
        </h2>
        <Card>
          <DataSaverToggle />
          <p className={styles.note}>
            {t('presence.dataSaverNote', 'Turn it on — the avatars above become light placeholders.')}
          </p>
          <div className={styles.badgeRow}>
            {ALL_SYNC.map((s) => (
              <SyncBadge key={s} status={s} />
            ))}
          </div>
          <div className={styles.badgeRow}>
            {ALL_CHANNELS.map((c) => (
              <ChannelBadge key={c} channel={c} />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default PresenceShowcase;
