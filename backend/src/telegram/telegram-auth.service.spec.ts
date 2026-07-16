import { createHash, createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { TelegramAuthService } from './telegram-auth.service';

describe('TelegramAuthService', () => {
  const token = 'test-token';
  const service = new TelegramAuthService({
    get: (key: string) => (key === 'TELEGRAM_BOT_TOKEN' ? token : undefined),
  } as ConfigService);

  function signedData(authDate: number) {
    const values = new URLSearchParams({
      auth_date: String(authDate),
      query_id: 'query-1',
      signature: 'telegram-ed25519-signature',
      user: JSON.stringify({ id: 123, first_name: 'Aida' }),
    });
    const fields: string[] = [];
    values.forEach((value, key) => fields.push(`${key}=${value}`));
    fields.sort();
    const secret = createHmac('sha256', 'WebAppData').update(token).digest();
    values.set(
      'hash',
      createHmac('sha256', secret).update(fields.join('\n')).digest('hex'),
    );
    return values.toString();
  }

  function signedWidgetData(authDate: number) {
    const data = {
      id: 123,
      first_name: 'Aida',
      username: 'aida',
      auth_date: authDate,
    };
    const fields = Object.entries(data)
      .map(([key, value]) => `${key}=${String(value)}`)
      .sort();
    const secret = createHash('sha256').update(token).digest();
    return {
      ...data,
      hash: createHmac('sha256', secret)
        .update(fields.join('\n'))
        .digest('hex'),
    };
  }

  it('accepts authentic and fresh Mini App data', () => {
    expect(
      service.validateMiniAppData(signedData(Math.floor(Date.now() / 1000))),
    ).toMatchObject({
      id: 123,
      first_name: 'Aida',
    });
  });

  it('rejects expired Mini App data', () => {
    expect(() =>
      service.validateMiniAppData(
        signedData(Math.floor(Date.now() / 1000) - 600),
      ),
    ).toThrow('expired');
  });

  it('accepts authentic and fresh Login Widget data', () => {
    expect(
      service.validateWidgetData(
        signedWidgetData(Math.floor(Date.now() / 1000)),
      ),
    ).toMatchObject({ id: 123, first_name: 'Aida', username: 'aida' });
  });

  it('rejects a forged Login Widget signature', () => {
    expect(() =>
      service.validateWidgetData({
        ...signedWidgetData(Math.floor(Date.now() / 1000)),
        first_name: 'Attacker',
      }),
    ).toThrow('signature');
  });
});
