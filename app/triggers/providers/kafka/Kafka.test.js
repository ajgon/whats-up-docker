const { ValidationError } = require('joi');
const Kafka = require('./Kafka');

const kafka = new Kafka();

const configurationValid = {
    brokers: 'broker1:9000, broker2:9000',
    topic: 'wud-image',
    clientId: 'wud',
    ssl: false,
};

test('validateConfiguration should return validated configuration when valid', () => {
    const validatedConfiguration = kafka.validateConfiguration(configurationValid);
    expect(validatedConfiguration).toStrictEqual(configurationValid);
});

test('validateConfiguration should apply_default_configuration', () => {
    const validatedConfiguration = kafka.validateConfiguration({
        brokers: 'broker1:9000, broker2:9000',
    });
    expect(validatedConfiguration).toStrictEqual(configurationValid);
});

test('validateConfiguration should validate_optional_authentication', () => {
    const validatedConfiguration = kafka.validateConfiguration({
        ...configurationValid,
        authentication: {
            user: 'user',
            password: 'password',
        },
    });
    expect(validatedConfiguration).toStrictEqual({
        ...configurationValid,
        authentication: {
            user: 'user',
            password: 'password',
            type: 'PLAIN',
        },
    });
});

test('validateConfiguration should throw error when invalid', () => {
    const configuration = {
        ssl: 'whynot',
    };
    expect(() => {
        kafka.validateConfiguration(configuration);
    }).toThrowError(ValidationError);
});

test('maskConfiguration should mask sensitive data', () => {
    kafka.configuration = {
        brokers: 'broker1:9000, broker2:9000',
        topic: 'wud-image',
        clientId: 'wud',
        ssl: false,
        authentication: {
            type: 'PLAIN',
            user: 'user',
            password: 'password',
        },
    };
    expect(kafka.maskConfiguration()).toEqual({
        brokers: 'broker1:9000, broker2:9000',
        topic: 'wud-image',
        clientId: 'wud',
        ssl: false,
        authentication: {
            type: 'PLAIN',
            user: 'user',
            password: 'p******d',
        },
    });
});

test('maskConfiguration should not fail if no auth provided', () => {
    kafka.configuration = {
        brokers: 'broker1:9000, broker2:9000',
        topic: 'wud-image',
        clientId: 'wud',
        ssl: false,
    };
    expect(kafka.maskConfiguration()).toEqual({
        brokers: 'broker1:9000, broker2:9000',
        topic: 'wud-image',
        clientId: 'wud',
        ssl: false,
    });
});
