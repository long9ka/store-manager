const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// models
const User = require('../models/User');
const Profile = require('../models/Profile');
const Permission = require('../models/Permission');

const {
    validationResult
} = require('express-validator');

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    // passport login
    passport.use('login', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        (req, username, password, done) => {
            User.findOne({
                    username
                })
                .then(user => {
                    if (!user) {
                        return done(null, false, {
                            message: 'Username not registered'
                        });
                    }
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            return done(null, false);
                        }
                        if (isMatch) {
                            done(null, user);
                        } else {
                            done(null, false, {
                                message: 'Password incorrect'
                            });
                        }
                    })
                })
        }
    ))

    // passport register
    passport.use('register', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        async (req, username, password, done) => {
            // validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return done(null, false, {
                    message: errors.array()[0].msg
                });
            }

            const {
                email,
                fullName,
                birthday,
                gender
            } = req.body;
            User.findOne({
                    username
                })
                .then(user => {
                    if (user) {
                        return done(null, false, {
                            message: 'Username already exists'
                        });
                    }
                    Profile.findOne({
                            email
                        })
                        .then(profile => {
                            if (profile) {
                                return done(null, false, {
                                    message: 'Email already exists'
                                });
                            }
                            // new Profile
                            const newProfile = new Profile({
                                email,
                                fullName,
                                birthday,
                                gender
                            })
                            newProfile.save()
                                .then()
                                .catch(error => console.error(error.message))

                            // new User 
                            let newUser = new User({
                                username,
                                password,
                                profileId: newProfile.id,
                                roles: ['guest']
                            })
                            let newPermission = new Permission({
                                permission: 'guest',
                                profileId: newProfile.id
                            })
                            newPermission.save()
                                .then()
                                .catch(error => console.error(error.message))
                            // bcrypt
                            bcrypt.genSalt(10, (err, salt) => {
                                bcrypt.hash(newUser.password, salt, (err, hash) => {
                                    if (err) {
                                        return done(err, false);
                                    }
                                    newUser.password = hash;
                                    newUser.save()
                                        .then(user => done(null, user))
                                        .catch(error => console.log(error.message));
                                })
                            })
                        })
                })
        }
    ));
}