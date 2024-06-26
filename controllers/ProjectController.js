//Imports
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const Dev = require('../models/Dev');

//Helpers
const createUserToken = require('../helpers/create-user-token');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

module.exports = class ProjectController {

    static async addProject(req, res) {
        let {title, description, repository} = req.body;

        let token = getToken(req);
        let dev = await getUserByToken(token, Dev);

        let project = new Project({
            title: title,
            description: description,
            repository: repository,
            devId: dev._id.toString(),
        });

        try {
            let data = await project.save();
            return res.status(201).json({ data: data });
        } catch (error) {
            res.status(500).json({ message: error });
        }
    }

    static async get(req, res) {
        let id = req.query.id;

        if (id) {
            let data = await Project.findOne({ _id: id });
            return res.status(200).json({ data: data });            
        }

        let data = await Project.find().sort('-createdAt');
        return res.status(200).json({ data: data });
    }

    static async editProject(req, res) {
        
        //Get and check id
        let { id } = req.params;

        let project = await Project.findById(id);

        if(!project) {
            return res.status(404).json({ message: 'Projeto não encontrado!' });
        }

        //Get by token
        let token = getToken(req);
        let dev = await getUserByToken(token, Dev);

        if (project.devId !== dev._id.toString()) {
            return res.status(401).json({ message: 'Algo deu errado!' });
        }

        let { title, description, repository } = req.body;
        let files = req.files;

        if(!title || !description) {
            return res.status(422).json({ message: 'Preencha todos os campos!' });
        }

        let images = [];

        if (files) {
            files.map((file) => {
                images.push(file.filename)
            });
        }

        project.title = title;
        project.description = description;
        project.repository = repository;
        project.images = images;

        try {
            let data = await Project.findOneAndUpdate(
                { _id: project._id },
                { $set: project },
                { new: true },
            );

            res.json({
                message: 'Operação realizada com sucesso!',
                data: data,
            });
        } catch (error) {
            res.status(500).json({ message: error });
        }
    }

    static async deleteProject(req, res) {
        let { id } = req.params;

        let project = await Project.findById(id);

        if(!project) {
            return res.status(404).json({ message: 'Projeto não encontrado!' });
        }

        //Get by token
        let token = getToken(req);
        let dev = await getUserByToken(token, Dev);

        if (project.devId !== dev._id.toString()) {
            return res.status(401).json({ message: 'Algo deu errado!' });
        }

        await Project.findByIdAndDelete(project._id);

        return res.status(204).json({ message: 'Exclusão realizada com sucesso' });
    }
}