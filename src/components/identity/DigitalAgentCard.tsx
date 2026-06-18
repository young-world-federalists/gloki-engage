import React from 'react';
import { Card, Button, Badge, CountryFlag, CountryPresence } from '../shared';
import { Pencil, History } from 'lucide-react';
import { useT } from '../../i18n';
import { getInitials, type DigitalAgent } from './agent/digitalAgentStore';
import { getPersona, DEMO_PARTICIPATION } from '../../services/demo/fixtures/identity';
import { getLanguageNative } from '../../utils/languages';
import styles from './DigitalAgentCard.module.scss';

interface Props {
  agent: DigitalAgent;
  onEdit?: () => void;
}

const DigitalAgentCard: React.FC<Props> = ({ agent, onEdit }) => {
  const t = useT();
  const name = agent.displayName?.trim() || t('agent.unnamed', 'Your profile');
  const voucherCountries = agent.vouchedBy
    .map((k) => getPersona(k)?.country)
    .filter((c): c is string => !!c);

  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <div className={styles.avatar} aria-hidden>
          {agent.photo ? <img src={agent.photo} alt="" /> : <span>{getInitials(agent.displayName)}</span>}
        </div>
        <div className={styles.identity}>
          <h2 className={styles.name}>{name}</h2>
          {agent.country && <CountryFlag code={agent.country} showName />}
          {onEdit && (
            <Button
              className={styles.editBtn}
              variant="ghost"
              size="sm"
              leftIcon={<Pencil size={16} />}
              onClick={onEdit}
            >
              {t('agent.editProfile', 'Edit profile')}
            </Button>
          )}
        </div>
      </div>

      {(agent.languages?.length ?? 0) > 0 && (
        <div className={styles.langs}>
          {agent.languages.map((code) => (
            <Badge key={code} tone="neutral">
              {getLanguageNative(code)}
            </Badge>
          ))}
        </div>
      )}

      {(agent.vouchedBy?.length ?? 0) > 0 && (
        <div className={styles.vouch}>
          <CountryPresence
            countries={voucherCountries}
            size="sm"
            label={t('agent.vouchedBy', 'Vouched by {count}', { count: agent.vouchedBy.length })}
          />
        </div>
      )}

      <div className={styles.history}>
        <span className={styles.historyTitle}>
          <History size={16} aria-hidden /> {t('agent.activity.title', 'Participation')}
        </span>
        {DEMO_PARTICIPATION.length === 0 ? (
          <p className={styles.historyEmpty}>{t('agent.activity.none', 'No activity yet')}</p>
        ) : (
          <ul className={styles.historyList}>
            {DEMO_PARTICIPATION.map((e, i) => (
              <li key={i} className={styles.historyItem}>
                <span className={styles.historyName}>{t(e.titleKey, e.defaultTitle)}</span>
                <Badge tone="info" size="sm">
                  {t(e.stageKey, e.defaultStage)}
                </Badge>
                <span className={styles.historyWhen}>{e.when}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

export default DigitalAgentCard;
