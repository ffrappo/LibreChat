const passport = require('passport');

const requireJwtAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      console.log(err);
    }
    if (!user) {
      console.log('(requireJwtAuth): No user');
    }
    // Assigns a value to req.user no matter what
    // Known possible values:
    //   false: no logged in user
    //   user object: logged in user
    req.user = user;
    next();
  })(req, res, next);
}

module.exports = requireJwtAuth;
