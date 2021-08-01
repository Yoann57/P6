const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const maskemail = require("maskemail");

exports.signup = (req, res, next) => {
  var passwordValidator = require('password-validator');
  var schema = new passwordValidator();
  schema
    .is().min(8) // Minimum length 8
    .is().max(100) // Maximum length 100
    .has().uppercase() // Must have uppercase letters
    .has().lowercase() // Must have lowercase letters
    .has().digits(2) // Must have at least 2 digits
    .has().not().spaces() // Should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

  if (!schema.validate(req.body.password)) {
    return res.status(500).json({
      error: 'mot de pass incomplet'
    })
  }
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: maskemail(req.body.email, {
          allowed: /@\.-/
        }),
        password: hash
      });
      user.save()
        .then(() => res.status(201).json({
          message: 'Utilisateur créé !'
        }))
        .catch(error => res.status(400).json({
          error
        }));
    })
    .catch(error => res.status(500).json({
      error
    }));
};

exports.login = (req, res, next) => {
  User.findOne({
      email: maskemail(req.body.email)
    })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          error: 'Utilisateur non trouvé !'
        });
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({
              error: 'Mot de passe incorrect !'
            });
          }
          req.session = user._id;
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({
                userId: user._id
              },
              process.env.JWT_PASSPHRASE, {
                expiresIn: '24h'
              }
            )
          });
        })
        .catch(error => res.status(500).json({
          error
        }));
    })
    .catch(error => res.status(500).json({
      error
    }));
};