import parseContentpassToken from './parseContentpassToken';

describe('parseContentpassToken', () => {
  it('should parse the contentpass token', () => {
    const exampleToken =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY5NzUwYTZjLTNmYjctNDUyNi05NWY4LTVhZmYxMmIyZjFjOSJ9.eyJhdXRoIjp0cnVlLCJ0eXBlIjoiY3AiLCJwbGFucyI6WyIwYWNhZTkxNy1iZTk5LTQ4ZWEtYjhmMS0yMGZhNjhhNDdkM2EiLCI0NDIxNjI4Yy05NjA2LTRjMDEtOGU1ZC1jMmE5YmNhNjhhYjQiLCI3ZThkZTBjYy0zZTk3LTQ5YTItODgxZC05ZmZiNWI4NDE1MTUiLCJhNDcyMWRiNS02N2RmLTQxNDUtYmJiZi1jYmQwOWY3ZTAzOTciLCJjNGQzYjBmNS05ODlhLTRmN2ItOGFjNy0zZDhmZmE5NTcxN2YiLCI2NGRkOTkwNS05NmUxLTRmYjItOTgwZC01MDdmMTYzNzVmZTkiXSwiYXVkIjoiY2MzZmM0YWQiLCJpYXQiOjE3MzMxMzU2ODEsImV4cCI6MTczMzMxMjA4MX0.CMtH7HRLf2HVgw3_cZRN0en8tml_SQKM73iLGJAp72-vJuRJaq85xBp6Jgy9WD3L7x4itRlBAYZxX8tLxZGogU0WP4_dMGFQ2QlcwKshwJygwRM1YqvxGWX2Az_KxEMc2QGHvpE1qe2MAr_xOU7VFfc0-vWxFc3hRzpAM5j7YHctj2t1v6h9-M7V2Hkcn37569QmtgU8gJkUxXsgUTufbb1ikjjjAvnjvTluHJo51_utbimpUbCk3EFxXVCVEI_pAqiZQXNninUQ6dbSujLb3L2UlEdQzLeUiBdYroeFzSyruLrR841ledLQ5ZP2OqzF5oUMuAGVOOhmgGdwGMCDRQ';

    const result = parseContentpassToken(exampleToken);

    expect(result).toEqual({
      body: {
        aud: 'cc3fc4ad',
        auth: true,
        exp: 1733312081,
        iat: 1733135681,
        plans: [
          '0acae917-be99-48ea-b8f1-20fa68a47d3a',
          '4421628c-9606-4c01-8e5d-c2a9bca68ab4',
          '7e8de0cc-3e97-49a2-881d-9ffb5b841515',
          'a4721db5-67df-4145-bbbf-cbd09f7e0397',
          'c4d3b0f5-989a-4f7b-8ac7-3d8ffa95717f',
          '64dd9905-96e1-4fb2-980d-507f16375fe9',
        ],
        type: 'cp',
      },
      header: {
        alg: 'RS256',
        kid: '69750a6c-3fb7-4526-95f8-5aff12b2f1c9',
      },
    });
  });

  it('should throw an error if the token is invalid', () => {
    const invalidToken =
      'eyJhdXRoIjp0cnVlLCJ0eXBlIjoiY3AiLCJwbGFucyI6WyIwYWNhZTkxNy1iZTk5LTQ4ZWEtYjhmMS0yMGZhNjhhNDdkM2EiLCI0NDIxNjI4Yy05NjA2LTRjMDEtOGU1ZC1jMmE5YmNhNjhhYjQiLCI3ZThkZTBjYy0zZTk3LTQ5YTItODgxZC05ZmZiNWI4NDE1MTUiLCJhNDcyMWRiNS02N2RmLTQxNDUtYmJiZi1jYmQwOWY3ZTAzOTciLCJjNGQzYjBmNS05ODlhLTRmN2ItOGFjNy0zZDhmZmE5NTcxN2YiLCI2NGRkOTkwNS05NmUxLTRmYjItOTgwZC01MDdmMTYzNzVmZTkiXSwiYXVkIjoiY2MzZmM0YWQiLCJpYXQiOjE3MzMxMzU2ODEsImV4cCI6MTczMzMxMjA4MX0.CMtH7HRLf2HVgw3_cZRN0en8tml_SQKM73iLGJAp72-vJuRJaq85xBp6Jgy9WD3L7x4itRlBAYZxX8tLxZGogU0WP4_dMGFQ2QlcwKshwJygwRM1YqvxGWX2Az_KxEMc2QGHvpE1qe2MAr_xOU7VFfc0-vWxFc3hRzpAM5j7YHctj2t1v6h9-M7V2Hkcn37569QmtgU8gJkUxXsgUTufbb1ikjjjAvnjvTluHJo51_utbimpUbCk3EFxXVCVEI_pAqiZQXNninUQ6dbSujLb3L2UlEdQzLeUiBdYroeFzSyruLrR841ledLQ5ZP2OqzF5oUMuAGVOOhmgGdwGMCDRQ';

    expect(() => {
      parseContentpassToken(invalidToken);
    }).toThrow('Invalid token');
  });
});
