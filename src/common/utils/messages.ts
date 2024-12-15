export const MESSAGES = {
  ERROR_MESSAGES : {
      INVALID_ACCESS_TOKEN: "Invalid token.",
      NOT_AN_ORGANIZER: "Sorry you are not an organizer",
      BAD_REQUEST: "Bad Request.",
      HELLO_FROM_THE_OTHER_SIDE: "HELLO FROM THE OTHER SIDE",
      SOMETHING_WENT_WRONG: "Something went wrong.",
      USERS_MUST_BE_A_NUMBER: "'users' must be a positive number.",
      INSTANCES_GT:"Number of instances must be greater than 0!.",
      EVENTID_REQUIRED: 'eventId is required!.',
      INCRCT_PSWRD:'Incorrect password!',
      INVALID_SERVER_CONFIGURATION: (str: string) => `Invalid server configuration for ${str}.`,
    },
  SUCCESS_MESSAGES: {
    SERVER_INSTANCES_CREATED: 'Server instances created successfully.'
  },
  LOGG_MESSAGES: {
    INVALID_MAX_USERS : "Invalid 'MAX_USERS_PER_INSTANCE' configuration value:",
    CREATING_INSTANCES: "Creating server instances and number of instances "
  }
}