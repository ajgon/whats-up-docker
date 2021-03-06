const { ValidationError } = require('joi');
const Slack = require('./Slack');

const slack = new Slack();

const configurationValid = {
    token: 'token',
    channel: 'channel',
};

test('validateConfiguration should return validated configuration when valid', () => {
    const validatedConfiguration = slack.validateConfiguration(configurationValid);
    expect(validatedConfiguration).toStrictEqual(configurationValid);
});

test('validateConfiguration should throw error when invalid', () => {
    expect(() => {
        slack.validateConfiguration({});
    }).toThrowError(ValidationError);
});

test('maskConfiguration should mask sensitive data', () => {
    slack.configuration = {
        token: 'token',
        channel: 'channel',
    };
    expect(slack.maskConfiguration()).toEqual({
        token: 't***n',
        channel: 'channel',
    });
});
