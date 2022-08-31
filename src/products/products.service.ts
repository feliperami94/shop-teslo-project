import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, ObjectID, Repository, Like, TreeLevelColumn } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import {validate as isUUID} from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger()

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}

  async create(createProductDto: CreateProductDto) {

    try {
      const product = this.productRepository.create(createProductDto); //This only creates the entity from the dto. Doesn´t affect the db
      await this.productRepository.save(product)
      return product
      
    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;
    return await this.productRepository.find({
      take: limit,
      skip: offset
    });
  }

  async findOne(searchTerm: string) {
  let product: Product;
    if(isUUID(searchTerm)){
      product = await this.productRepository.findOneBy({id: searchTerm})
    } else{
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
      .where(`UPPER(title) =:title or slug=:slug`, { //The two dots is to give the parameter
        title: searchTerm.toUpperCase(),
        slug: searchTerm.toLowerCase()
      }).getOne()

    }

    if (!product){
      throw new NotFoundException(`Couldn't find any product with the id ${searchTerm}`)
    } 
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({ //The preload just find the record with the id and prepare it for the action.
      id: id,
      ...updateProductDto
    })

    if(!product) throw new NotFoundException(`Product with id: ${id} not found`)

    try {
      const updatedProduct = await this.productRepository.save(product);
      return updatedProduct
      
    } catch (error) {
      this.handleDBExceptions(error)
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    if (product){
      await this.productRepository.delete({id})
    } 
  }

  private handleDBExceptions(error: any ){
    if (error.code === '23505')
        throw new BadRequestException(error.detail)
      this.logger.error(error)
      throw new InternalServerErrorException('Unexpected error, check server logs')
  }


}
