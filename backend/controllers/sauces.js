const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: []
  });
  sauce.save()
    .then(() => res.status(201).json({
      message: 'Sauce enregistrée !'
    }))
    .catch(error => res.status(400).json({
      error
    }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : {
    ...req.body
  };
  Sauce.updateOne({
      _id: req.params.id
    }, {
      ...sauceObject,
      _id: req.params.id
    })
    .then(() => res.status(200).json({
      message: 'Sauce modifiée !'
    }))
    .catch(error => res.status(400).json({
      error
    }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({
      _id: req.params.id
    })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({
            _id: req.params.id
          })
          .then(() => res.status(200).json({
            message: 'Sauce supprimée !'
          }))
          .catch(error => res.status(400).json({
            error
          }));
      });
    })
    .catch(error => res.status(500).json({
      error
    }));
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

const addLike = (sauceId, userId) => {
  return Sauce.updateOne({
    _id: sauceId
  }, {
    $push: {
      usersLiked: userId
    },
    $inc: {
      likes: +1
    },
  })
}
const disLike = (sauceId, userId) => {
  return Sauce.updateOne({
    _id: sauceId
  }, {
    $push: {
      usersDisliked: userId
    },
    $inc: {
      dislikes: +1
    },
  })
}
const annuLike = (sauceId, userId) => {
  return Sauce.updateOne({
    _id: sauceId
  }, {
    $pull: {
      usersLiked: userId
    },
    $inc: {
      likes: -1
    },
  })
}
const annulDislike = (sauceId, userId) => {
  return Sauce.updateOne({
    _id: sauceId
  }, {
    $pull: {
      usersDisliked: userId
    },
    $inc: {
      dislikes: -1
    },
  })
}
exports.likeDislike = async (req, res, next) => {
  let like = req.body.like
  let userId = req.body.userId
  let sauceId = req.params.id

  try {
    if (like === 1) {
      await addLike(sauceId, userId)
      res.status(200).json({
        message: 'j\'aime ajouté !'
      })
    } else if (like === -1) {
      await disLike(sauceId, userId)
      res.status(200).json({
        message: 'Dislike ajouté !'
      })
    } else if (like === 0) {
      const sauce = await Sauce.findOne({
        _id: sauceId
      })
      if (sauce === null) {
        return res.status(404).json({
          error: 'sauce non trouvée'
        })
      } else if (sauce.usersLiked.includes(userId)) {
        await annuLike(sauceId, userId)
        res.status(200).json({
          message: 'Like annulé'
        })
      } else if (sauce.usersDisliked.includes(userId)) {
        await annulDislike(sauceId, userId)
        res.status(200).json({
          message: 'Dislike annulé'
        })
      }
    }
  } catch (error) {
    res.status(404).json({
      error
    })
  }
}